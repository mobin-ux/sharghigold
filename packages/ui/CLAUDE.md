# @sharghigold/ui

The Zarnama Gold design system, ported from a Claude Design bundle.

- `src/styles/tokens/*.css`: colours, spacing, type, motion. Use tokens, never
  raw values.
- `src/components/`: primitives (`Button`, `Badge`, `Alert`, `ProductCard`…).
- **Generated, do not edit or read:** `src/generated/`,
  `src/styles/generated/`, and the input `design-system/_ds_bundle.js` (160 KB).
  Regenerate with `generate:contracts` / `generate:css`; drift tests fail if
  the output was edited by hand.
- `assets/fonts/` must stay byte-identical to `apps/storefront/public/fonts/`
  (checked by `fonts.test.ts`).
- `contrast.ts` checks the palette meets WCAG AA in tests.
