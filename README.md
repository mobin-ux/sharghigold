# sharghigold

Production-grade gold & jewellery e-commerce platform (Persian, RTL).

Status: **Phase 2 — architecture**. See `docs/adr/` for the decision records.

## Getting started

Requires Node ≥ 22 and pnpm 12.

```bash
pnpm install
pnpm verify
```

`verify` runs format → build packages → typecheck → test → build.

**The package build has to come first.** Every app resolves `@sharghigold/*`
through each package's `dist/`, so on a clean checkout `typecheck` cannot
resolve a workspace import until `build:packages` has run. Running `pnpm
typecheck` on its own straight after a clone will report a wall of `TS2307`s for
that reason and nothing else; run `pnpm build:packages` first.

## Layout

| Path                 | What it is                                        |
| -------------------- | ------------------------------------------------- |
| `apps/api`           | NestJS service. All business rules live here.     |
| `apps/storefront`    | Next.js storefront. Rendering and routing only.   |
| `packages/money`     | Exact rial/milligram arithmetic. Pure, no I/O.    |
| `packages/contracts` | Zod schemas shared by the API and the storefront. |
| `packages/database`  | Prisma schema, migrations and domain constraints. |
| `packages/ui`        | The Zarnama Gold design system, ported.           |

## Database invariants

The schema carries CHECK constraints the ORM cannot express. They have their own
self-check, which tries to violate each one and fails if any does not fire:

```bash
pnpm --filter @sharghigold/database check:constraints
```

It needs `DATABASE_URL` pointing at a migrated, throwaway database. It runs
inside a transaction it always rolls back.

## Before launch

- **Webfont licence.** Peyda and AriaWeb are commercial typefaces and the
  licence is unconfirmed. See `packages/ui/assets/fonts/README.md`.
- **Fee rates.** The making-fee, profit and VAT rates are configuration, not
  constants, and the real figures still need supplying. See ADR 0001.
- **CI.** ADR 0001 commits to running the suite on Linux against real Postgres
  and Redis containers. Not set up yet.
