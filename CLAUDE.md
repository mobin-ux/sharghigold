# sharghigold — working notes for Claude

Persian (RTL) gold and jewellery shop. pnpm monorepo, Node ≥ 22, pnpm 12,
TypeScript 7 strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
The _why_ behind every rule lives in `docs/adr/`; read one only when a change
touches the decision it records. Each workspace has its own `CLAUDE.md`, loaded
when you work inside it.

## Where things are

| Workspace            | Holds                                                         |
| -------------------- | ------------------------------------------------------------- |
| `apps/storefront`    | Next.js 16 App Router. Pages, Server Actions, dev-only store. |
| `apps/api`           | NestJS (`/api/v1`). Error envelope, admin RBAC guard.         |
| `packages/contracts` | Zod schemas + types shared by both apps. The only Zod user.   |
| `packages/money`     | Exact rial/milligram/basis-point arithmetic and formatting.   |
| `packages/database`  | Prisma schema, migrations, SQL CHECK constraints.             |
| `packages/ui`        | Design tokens, CSS, primitive components, generated code.     |

| To change…                     | Start at                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| A page or route                | `apps/storefront/src/app/<route>/page.tsx`                     |
| A form submission              | `app/<route>/actions.ts` (+ `state.ts` for initial state)      |
| An internal link or redirect   | `apps/storefront/src/lib/routes.ts` — the only URL builder     |
| Business logic (cart, orders…) | `apps/storefront/src/server/<domain>/`                         |
| Rates, instalment terms, VAT   | `apps/storefront/src/config/commerce-terms.ts`                 |
| Account/cart/order records     | `apps/storefront/src/server/account/store/` (import the index) |
| Products, categories           | `apps/storefront/src/server/catalogue/`                        |
| A request/response shape       | `packages/contracts/src/<domain>.ts`, exported from `index.ts` |
| Price or money formatting      | `packages/money` (`quoteGoldPrice`, `formatToman`)             |
| Labels/formatting for a screen | `apps/storefront/src/lib/<domain>-view.ts`                     |
| Backend seams                  | `apps/storefront/src/server/ports.ts`                          |
| Admin permissions              | `packages/contracts/src/admin.ts`, `apps/api/src/admin/`       |

## Rules the types do not enforce

- **Money is `bigint`.** Rials, milligrams and basis points never pass through
  `number` or floats. Money crosses to the browser as a string. The server
  prices everything; nothing reads a price, total or rate from a request.
- **Owner-scoped reads.** Store and gateway functions take the customer id as a
  parameter. Somebody else's record is `undefined` and the route answers 404.
- **Validate at the boundary** with a contracts schema. A Server Action that
  acts for a customer resolves them itself with `requireViewer()` (never from
  a form field) and rate-limits anything that can be abused.
- **No literal internal `href`s, redirects or form actions.** Use `routes.*`.
  `lib/__tests__/routes.test.ts` fails the build on a literal or a dead link.
- **Never** log secrets or raw errors, commit `.env`, or add `dangerouslySetInnerHTML`.

## Commands

```bash
pnpm verify                 # format, lint, build packages, typecheck, test, build apps (~30s warm)
pnpm dev                    # storefront on :3000 (dev OTP codes print to its log)
pnpm --filter @sharghigold/storefront exec vitest run src/server/cart   # one area
pnpm build:packages         # required before typecheck on a clean checkout
```

Apps import packages through `dist/`: after editing a package, rebuild it
(`pnpm --filter @sharghigold/<pkg> build`) before the apps can see the change.

## Conventions

- Tests sit in `__tests__/` beside the module. Vitest, no snapshots.
- Oxlint enforces `consistent-type-imports`, `no-console`, `import/no-cycle`,
  `toSorted` over `sort`. Prettier: 100 columns, single quotes.
- Commits: `feat|fix|refactor|perf|security|test|docs|chore(scope): …`, one
  concern each, `pnpm verify` green first.
- Comments explain _why_, in full sentences. Match the surrounding density.

## Saving tokens

- Search before reading: `Grep` for a symbol, then `Read` with `offset`/`limit`.
- Never read `packages/ui/design-system/_ds_bundle.js`, `pnpm-lock.yaml`, fonts,
  `**/generated/**`, `.next/` or `dist/`. They are large and machine-written.
- Large files, read by section: `server/catalogue/products.ts` (fixture data),
  `app/**/*.css` (one stylesheet per route; search for the class name).

## graphify

A knowledge graph of this repo is built at `graphify-out/` (git-ignored; build it
with `/graphify .` if missing).

- For a cross-cutting question ("what depends on X", "how does checkout reach
  the wallet"), run `graphify query "<question>"`, `graphify path "<A>" "<B>"` or
  `graphify explain "<symbol>"` before opening files.
- For a known file or symbol, go straight to `Grep`/`Read`.
- A post-commit hook refreshes the graph after code changes; check it with
  `graphify hook status`. After editing docs, run `graphify update .`.
