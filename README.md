# sharghigold

Production-grade gold & jewellery e-commerce platform (Persian, RTL).

Status: **Phase 2 — architecture**. See `docs/adr/` for the decision records.

## Getting started

Requires Node ≥ 22 and pnpm 12.

```bash
pnpm install
pnpm verify
```

`verify` runs format → lint → build packages → typecheck → test → build.

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

| Route                          | What it is                                     |
| ------------------------------ | ---------------------------------------------- |
| `/`                            | Mobile homepage. See ADR 0004.                 |
| `/categories`                  | The category browser. See ADR 0005.            |
| `/products/[slug]`             | The product page. See ADR 0006.                |
| `/products/[slug]/reviews`     | Every review, filtered and sorted server-side. |
| `/products/[slug]/reviews/new` | The review form.                               |
| `/products/[slug]/questions`   | Buyer questions and the shop's answers.        |
| `/products/[slug]/shipping`    | Delivery, returns and the authenticity terms.  |

All of them are ported from the Zarnama design canvas and verified against a
rendered copy of it by measurement, not by eye. The per-page geometry tables in
those ADRs are the reference if any of them needs changing.

Not built yet, and linked to from the pages above: `/categories/[slug]`,
`/checkout`, `/search`, `/cart`, `/account`, `/installment`, `/contact`,
`/about`. Only the five ring products in `server/catalogue/products.ts` have a
page; the homepage's other product links 404 until the catalogue API exists.

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
- **The price quote is unsigned.** A product page strikes a five-minute quote
  and the browser counts down to it, but nothing verifies the quote when an
  order is placed — there is no cart yet. Whatever builds `POST /api/v1/cart`
  must re-quote from the weight and the live rate and charge that. See ADR 0006.
- **Two price windows disagree.** `PRICE_QUOTE_TTL_SECONDS` in `.env.example` is
  900 seconds; the page's display lock, in `server/policy/shop-policy.ts`, is 300. They describe different things today and nothing enforces that reading.
