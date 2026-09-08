/**
 * Run `prisma/checks/constraints.sql` against DATABASE_URL and fail the process
 * if any invariant did not fire.
 *
 * The script existed but nothing executed it, so the seven — now ten —
 * assertions it makes were documentation rather than a check. This wraps it in
 * something CI can call. It uses `pg` directly rather than shelling out to
 * `psql`, because psql is not installed on every machine that runs the suite,
 * and it keeps the POSIX-path discipline the ADR asks for.
 *
 * Everything runs inside one transaction that is always rolled back, so it is
 * safe against a database with data in it — though CI should still point it at
 * a throwaway one.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const SQL_PATH = fileURLToPath(new URL('../prisma/checks/constraints.sql', import.meta.url));

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  console.error('DATABASE_URL is not set. Point it at a migrated throwaway database.');
  process.exit(2);
}

/**
 * `psql` metacommands and explicit transaction control are for interactive use;
 * this driver supplies both itself.
 */
function stripPsqlDirectives(sql) {
  return sql
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim().toUpperCase();
      return !line.trimStart().startsWith('\\') && trimmed !== 'BEGIN;' && trimmed !== 'ROLLBACK;';
    })
    .join('\n');
}

const client = new pg.Client({ connectionString });
const notices = [];

client.on('notice', (notice) => {
  const message = notice.message ?? '';
  notices.push(message);
  console.log(message);
});

let failed = false;

try {
  await client.connect();
  await client.query('BEGIN');
  try {
    await client.query(stripPsqlDirectives(readFileSync(SQL_PATH, 'utf8')));
  } finally {
    // Always roll back, including when an assertion raised.
    await client.query('ROLLBACK');
  }
} catch (error) {
  failed = true;
  console.error(`\nConstraint checks raised: ${error instanceof Error ? error.message : error}`);
} finally {
  await client.end();
}

const failures = notices.filter((line) => line.startsWith('FAIL:'));
if (failures.length > 0) {
  failed = true;
  console.error(`\n${String(failures.length)} constraint(s) did not fire.`);
}

if (!failed && !notices.some((line) => line.includes('all constraints fired correctly'))) {
  failed = true;
  console.error('\nThe check script did not run to completion.');
}

if (failed) process.exit(1);
console.log('\nAll domain constraints fired correctly.');
