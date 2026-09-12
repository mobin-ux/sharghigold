# sharghigold

Production-grade gold & jewellery e-commerce platform (Persian, RTL).

Status: **Phase 2 — architecture**. See `docs/adr/` for the decision records.

## Getting started

Requires Node ≥ 22 and pnpm 12.

```bash
pnpm install
pnpm verify
```

`verify` runs format → lint → build packages → typecheck → test → build apps.

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

## Pages

Forty-seven pages under `apps/storefront/src/app/`: the homepage, catalogue
listing, category and search, product pages, basket and checkout, account,
wallet, instalments, and the editorial pages. `lib/routes.ts` builds every
internal URL, and its test fails if any link, redirect or form action points at
a route that does not exist.

The homepage, category browser and product page are ported from the Zarnama
design canvas and verified against it by measurement; ADRs 0004–0006 hold the
geometry tables. `CLAUDE.md` at the root and in each workspace maps where
things live.

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
  and Redis containers. Not set up yet, and there is no `docker-compose.yml`.
- **The catalogue API.** The storefront reads categories through
  `getCategoryNavigation()` and products through `getProduct()`, both backed by
  literals until `GET /api/v1/categories` and `GET /api/v1/products/:slug`
  exist. See ADRs 0005 and 0006.
- **Nothing accepts a review or a question.** The forms validate server-side and
  then refuse, because there is no store and no session to attach a submission
  to. `postSubmission` is the seam. See ADR 0006.
- **Accounts, baskets and orders are in memory.** `server/account/store/` is a
  development stand-in that refuses to run in production. It mirrors
  `packages/database`, which nothing reads yet. See ADR 0007.
- **Two price windows disagree.** `PRICE_QUOTE_TTL_SECONDS` in `.env.example` is
  900 seconds; the basket's price lock, `PRICE_LOCK_SECONDS` in
  `apps/storefront/src/config/commerce-terms.ts`, is 300. They describe
  different things today and nothing enforces that reading.
