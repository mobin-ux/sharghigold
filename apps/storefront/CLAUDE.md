@AGENTS.md

# Storefront

`@/` is `src/`. Server Components by default; `'use client'` only where state
or events demand it.

## Layout of `src/`

```
app/            routes. page.tsx, actions.ts (Server Actions), state.ts (form
                initial state), loading.tsx, error.tsx, <route>.css
  layout.tsx    loads the global CSS: ui tokens → globals → shell → chrome → forms
  api/          route handlers (only /api/cart/count today)
components/     by feature: account cart catalogue categories content home marks
                product; top level = shared (icons.tsx, bottom-nav, loading-grid)
lib/            pure, browser-safe helpers. routes.ts, <domain>-view.ts
                (labels, tones, Persian formatting), gold-price.ts
server/         server-only. Gateways that become API calls; see ports.ts
  account/      session, OTP, crypto, rate-limit, account.ts (viewer-scoped
                reads); store/ = dev-only tables, one module per table
  catalogue/    products.ts (fixtures), taxonomy, listing, product, pricing,
                reviews, questions, submissions
  cart/ checkout/ wallet/ inventory/ marketing/ content/
  policy/       shop-policy (copy + terms), checkout-policy, installments
config/         brand.ts, commerce-terms.ts (the numbers the admin panel will own)
data/           static reference data (iran-regions.ts)
```

## Recipes

- **New page:** `app/<route>/page.tsx` + a builder in `lib/routes.ts`. The
  routes test fails until both exist. Add `loading.tsx` if it awaits data.
- **New form:** `actions.ts` with `'use server'`; parse `FormData` through a
  contracts schema; `requireViewer()` first; return a state from `state.ts`;
  client form uses `useActionState`.
- **New server data:** add to the relevant `server/<domain>` gateway, keep it
  async and owner-scoped, and parse fixtures through the contract.
- **Displayed numbers:** `persianCount`, `toman` in `lib/product-view.ts`;
  never `toLocaleString` on money.

## Tests

`pnpm --filter @sharghigold/storefront exec vitest run <path>`. Store-backed
tests call `resetAccountStore()` in `beforeEach`. Dev sign-in: mobile
`09120001234`; the OTP is printed to the dev server log.
