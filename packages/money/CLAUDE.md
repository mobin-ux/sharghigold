# @sharghigold/money

Exact arithmetic for a gold shop. Pure, no I/O, no dependencies.

- `rial.ts`: branded `Rials` (`bigint`), `allocateRials` (largest remainder).
- `weight.ts`: branded `Milligrams`.
- `rounding.ts`: `divideRounded` with an explicit rounding mode.
- `gold-pricing.ts`: `quoteGoldPrice` — weight × rate + making fee + profit,
  VAT on fee and profit only, rates in basis points. The one price formula.
- `format.ts`: `formatToman`, `formatGrams`, Persian digits and grouping.

Never introduce `number` or `Math` on an amount. Every rounding decision is
named at the call site. After a change: `pnpm --filter @sharghigold/money build`.
