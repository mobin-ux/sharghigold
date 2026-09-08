# ADR 0002 — Design system port

- **Status:** Accepted
- **Date:** 2026-09-07
- **Supersedes:** the styling sentence in [ADR 0001](0001-architecture.md)

## Context

The Zarnama Gold design system is authored in Claude Design: a token layer of
CSS custom properties, 33 components shipped as a browser global
(`window.ZarnamaGoldDesignSystem_e4dd01`), and `_adherence.oxlintrc.json`, which
encodes every component's prop contract as lint rules.

## Decisions

### No Tailwind — this supersedes ADR 0001

ADR 0001 said Tailwind would reference the design system's custom properties.
That was wrong, and it is reversed here.

The design system is already a complete token layer plus component classes. A
Tailwind config that only aliases the same tokens adds a dependency, a build
step and a second vocabulary for the same values, while making it _easier_ to
bypass the tokens — a raw `p-[13px]` is one keystroke away, and that is exactly
what the adherence rules forbid.

Styling is therefore plain CSS: the token layer imported once at the root, and
CSS Modules for component styles, all referencing `var(--token)`.

### The token layer ships as-is and is the source of truth

`src/styles/tokens/` is copied from the design system rather than reinterpreted,
so an upstream change is a re-copy, not a translation. Files are
Prettier-formatted on the way in; because Prettier is deterministic, a future
re-import formats identically and still diffs cleanly.

### One deviation: `--color-price`

`--gold-500` on the ivory ground measures **2.25:1**, below the 4.5:1 floor the
design system sets for itself and below even the 3:1 large-text allowance. This
is not a theoretical concern: gold-on-ivory is exactly how prices are emphasised
on every product card.

| Pairing                           | Ratio | Verdict |
| --------------------------------- | ----: | ------- |
| `gold-500` text on `ivory`        |  2.25 | fails   |
| `gold-700` text on `ivory`        |  4.87 | passes  |
| `gold-400` text on `teal-900`     |  9.10 | passes  |
| `gold-500` on `teal-800` (hero)   |  6.44 | passes  |
| `teal-900` on `gold-500` (button) |  7.13 | passes  |

The gold CTA was never the problem; only gold used as _text on a light ground_
is. `--color-price` resolves to `--gold-700` on light and `--gold-400` on dark.
This is an additive alias, which the system's own governance explicitly permits.

**Consequence:** prices render slightly darker than the design canvas shows.
That is a visible, deliberate difference and needs client sign-off.

These ratios are asserted in `src/__tests__/contrast.test.ts`, including a test
that gold-500 on ivory _fails_ — so anyone who later "simplifies" price text
back to the raw accent gets a failing build and an explanation.

### Fonts — now committed, licence still outstanding

The eleven `.woff2` files (Peyda ×5, AriaWeb ×6) declared in `tokens/fonts.css`
have been pulled from the design project and committed:

- `packages/ui/assets/fonts/` — canonical copies.
- `apps/storefront/public/fonts/` — what the app actually serves, at the
  absolute `/fonts/…` paths `tokens/fonts.css` references.

This matters more than it sounds. Against the Tahoma fallback the hero headline
took four lines instead of two and every price rendered in the wrong numeral
shapes, so the page could not be checked against the design at all. With the
real faces the implementation matches the canvas to the pixel — see ADR 0004.

> **Open — needs a commercial answer, not a technical one.** Peyda and AriaWeb
> are commercial Persian typefaces. Serving them from a public production site
> requires a **webfont licence**, and that licence has still not been confirmed.
> The files are in the repository because the design cannot be implemented or
> reviewed without them; that is not the same as clearance to deploy them.
> Confirm the licence before the site goes public, or substitute a face that is
> licensed for web use.

## Still to do

The 33 components are not ported yet. The plan is to generate TypeScript prop
types from `_adherence.oxlintrc.json` rather than hand-writing them, so the
component API cannot drift from the design system definition.
