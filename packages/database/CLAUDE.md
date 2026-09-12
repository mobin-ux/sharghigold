# @sharghigold/database

Prisma 7 with the `pg` adapter. Not yet read by either app; the storefront's
`server/account/store/` mirrors these tables until it is.

- `prisma/schema.prisma`: the model. Money columns are `BigInt` rials.
- `prisma/migrations/`: append-only. Never edit an applied migration; add one.
  Domain CHECK constraints the ORM cannot express live in the SQL.
- `prisma/checks/constraints.sql`: tries to violate every constraint
  (`pnpm --filter @sharghigold/database check:constraints`, needs a throwaway
  `DATABASE_URL`).
- `src/index.ts`: `createPrismaClient()`, `CRITICAL_TRANSACTION_OPTIONS`
  (serialisable, for money-moving transactions).
- `src/generated/` is Prisma output: do not read or edit.
