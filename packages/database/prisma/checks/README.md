# Constraint checks

`constraints.sql` attempts to violate every domain invariant added in the
`add_domain_constraints` migration and asserts that the database refuses each
one. It runs inside a transaction and rolls back, so it leaves no data behind.

Run it against a migrated database:

```
psql -U postgres -h 127.0.0.1 -d sharghigold_dev -q -f prisma/checks/constraints.sql
```

Every line should read `OK  : ... rejected`, ending with
`--- all constraints fired correctly ---`. Any `FAIL:` line means a constraint
is missing or wrong.

**Known gap:** this is a manual script, not an automated test. It should move
into an integration suite running against a throwaway database in CI, alongside
the API end-to-end tests that are still outstanding.
