# Constraint checks

`constraints.sql` attempts to violate every domain invariant added in the
`add_domain_constraints` migration and asserts that the database refuses each
one. It runs inside a transaction and rolls back, so it leaves no data behind.

Run it against a migrated database:

```
pnpm --filter @sharghigold/database check:constraints
```

That wrapper (`scripts/run-constraint-checks.mjs`) reads `DATABASE_URL`, runs
the script inside a transaction it always rolls back, and **exits non-zero if
any assertion did not fire** — so CI can call it. `psql` is not required.

The raw script also runs under psql if you prefer:

```
psql -U postgres -h 127.0.0.1 -d sharghigold_dev -q -f prisma/checks/constraints.sql
```

Every line should read `OK  : ... rejected`, ending with
`--- all constraints fired correctly ---`. Any `FAIL:` line means a constraint
is missing or wrong.

**Still outstanding:** the API end-to-end tests. This covers the database
invariants only.
