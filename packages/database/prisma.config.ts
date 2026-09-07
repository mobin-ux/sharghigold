import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 keeps the connection string out of the schema file, which is an
 * improvement: the schema is committed, the URL is not.
 *
 * The URL is read from the environment at the point of use, so a migration can
 * never be run against a database that was hardcoded in a committed file.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
