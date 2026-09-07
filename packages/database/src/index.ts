/**
 * @sharghigold/database — the Prisma client and the schema it is generated from.
 *
 * Packaged separately from the API so that the admin panel, background workers
 * and any future service share one schema and one set of migrations rather
 * than each growing their own copy (rule 23).
 *
 * The generated client is not committed: run `pnpm --filter @sharghigold/database generate`
 * (or any build, which does it for you) after changing the schema.
 */
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/client.js';

export { PrismaClient } from './generated/client.js';
export * from './generated/enums.js';

export interface DatabaseOptions {
  readonly databaseUrl: string;
  /** Emit query logs. Never enable in production: queries carry customer data. */
  readonly logQueries?: boolean;
  /**
   * Upper bound on pooled connections. Postgres serves a fixed number of
   * backends, so an unbounded pool turns a traffic spike into a hard outage
   * for every service sharing the database.
   */
  readonly maxConnections?: number;
}

/**
 * Build a client.
 *
 * Prisma 7 talks to Postgres through a driver adapter, so the connection is
 * configured here in code rather than in the committed schema file.
 */
export function createPrismaClient(options: DatabaseOptions): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: options.databaseUrl,
    max: options.maxConnections ?? 10,
  });

  return new PrismaClient({
    adapter,
    log: options.logQueries === true ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

/**
 * Isolation level for transactions that must not lose an update.
 *
 * Order placement and wallet debits use this together with `SELECT … FOR
 * UPDATE`: serializable alone still permits a stale read to be written back
 * under some interleavings, and row locks alone do not prevent phantom reads.
 * The two together are what make overselling impossible (rules 15 and 16).
 */
export const CRITICAL_TRANSACTION_OPTIONS = {
  isolationLevel: 'Serializable',
  timeout: 10_000,
  maxWait: 5_000,
} as const;
