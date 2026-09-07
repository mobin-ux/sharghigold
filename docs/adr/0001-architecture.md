# ADR 0001 — Platform architecture

- **Status:** Accepted
- **Date:** 2026-09-06
- **Context:** Greenfield. Production gold & jewellery e-commerce for the Iranian
  market, hosted inside Iran, RTL Persian, mobile-first.

## Decision summary

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Monorepo   | pnpm workspaces                           |
| Storefront | Next.js (App Router), React, TypeScript   |
| API        | NestJS, TypeScript — independent service  |
| Database   | PostgreSQL 17 + Prisma 7.10 (stable)      |
| Cache      | Redis (Memurai in local dev)              |
| Money      | `bigint` rials, never floating point      |
| Weight     | `bigint` milligrams, never floating point |

## Rationale

### Two applications, not one

The API is a standalone NestJS service. The storefront is a presentation and
BFF layer that holds no business logic. This is deliberate: a separate admin
panel is planned, and it must consume the same API rather than a second
implementation of the same rules. A Next.js route handler must never become the
place an order total is decided.

### Next.js for the storefront

Product pages must be crawlable and carry real metadata, which requires
server-side rendering. A client-rendered SPA would have made SEO a permanent
retrofit. Next.js is used for rendering, routing and caching only.

### Prisma 7.10.0, pinned

The `latest` dist-tag currently points at `8.0.0-rc.13`, a release candidate.
Production does not run on release candidates, so the version is pinned to the
newest stable, 7.10.0. Raw `SELECT … FOR UPDATE` remains available for the
inventory row-locking that gold stock requires.

### Money is `bigint` rials

The Iranian rial has no circulating minor unit, so an amount is a whole number
of rials. Two consequences:

1. **No floating point.** Order totals routinely exceed the range where a
   double is exact for integers, and a silently wrong total is a financial
   defect, not a rounding nit.
2. **Rial, not toman, is the stored unit.** Iranian payment gateways settle in
   rials. Storing what we settle in removes an entire class of factor-of-ten
   bug. Toman is applied at the presentation boundary only.

Weight follows the same reasoning: whole milligrams, because the trade quotes
to three decimals of a gram and `0.1 + 0.2 !== 0.3`.

Rates are **basis points** (integers), so a percentage never becomes a float.

### Rounding is always explicit

`divideRounded` requires a mode. Which way a half-rial goes is a business
decision, and burying it in a default is how discrepancies appear months later.

### VAT applies to the making fee and profit only

Iranian retail gold VAT is charged on اجرت + سود, **not** on the value of the
gold itself. Charging VAT on the whole subtotal overcharges every customer.
This is encoded in `quoteGoldPrice` and guarded by a regression test.

> **Open — needs business confirmation.** The default making-fee, profit and VAT
> rates are inputs, not constants; nothing is hardcoded. The actual rates
> Sharghi Gold charges still need to be supplied and stored as configuration.

### Allocation preserves the total

`allocateRials` uses largest-remainder distribution so an installment schedule
or a per-line tax split sums back to exactly the original amount. A 36-month
plan that loses three rials is a reconciliation bug.

## Local development environment

The development machine is a QEMU VPS **without nested virtualization**
(`SLAT: false`), so WSL2, Hyper-V and Docker cannot run on it. Postgres and
Redis are therefore installed natively (Memurai provides the Redis protocol on
Windows).

This creates a dev/prod parity gap, mitigated by:

- committing a `docker-compose.yml` that defines the real topology even though
  it cannot run on this host;
- running CI on Linux with real Postgres and Redis service containers, so every
  commit is validated against the production target;
- keeping all scripts and path handling POSIX-safe.

## Design system

The Zarnama Gold design system is imported from Claude Design. Tokens ship
verbatim as the source of truth; Tailwind references those CSS custom
properties rather than duplicating their values, so token changes upstream flow
through without a fork.

Two deviations, both flagged to the client:

1. **`--color-price` added.** `--gold-500` on the ivory ground measures
   **2.25:1**, below the 4.5:1 floor the design system itself sets. The new
   semantic token resolves to `--gold-700` on light (4.87:1) and `--gold-400` on
   dark. Purely additive, which the system's own governance permits.
2. **«زرنما» is a placeholder brand** per the design system readme. It is
   isolated in a single constant so renaming is a one-line change.

## Consequences

- Business logic is testable without a database, because `@sharghigold/money` is
  pure — no I/O, no clock, no configuration.
- Adding the admin panel later requires no change to the API's shape.
- The team must accept `bigint` ergonomics (no `+` on mixed types, explicit
  serialisation at the API boundary). That cost is paid deliberately in exchange
  for exactness.
