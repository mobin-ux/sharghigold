# ADR 0003 — Porting the design system components, and the homepage

Date: 2026-09-07
Status: Accepted
Supersedes: nothing. Extends [ADR 0002](0002-design-system.md).

## Context

ADR 0002 brought in the design system's token layer and generated TypeScript
contracts from `_adherence.oxlintrc.json`, but left the 33 components
unported. This ADR covers porting the ones the mobile homepage needs, and
building that page.

The design system ships as `_ds_bundle.js` — a compiled React bundle where each
component carries its own CSS as a template literal and injects it into
`document.head` on first render. It was authored for a client-only React app.
The storefront is Next.js with server rendering, and product pages have to be
crawlable.

## Decisions

### 1. The component CSS is extracted from the bundle, not transcribed

`packages/ui/scripts/extract-component-css.mjs` lifts all 31 stylesheets out of
`_ds_bundle.js` into `src/styles/generated/components.css`, byte for byte, and a
test byte-compares the committed file against the generator's output.

Runtime injection is wrong here for two reasons: there is no `document` during
server rendering, so markup would arrive unstyled and only gain its appearance
once the client bundle ran; and it makes styling depend on JavaScript at all,
when a stylesheet is something the browser can fetch, cache and apply on its
own.

Transcribing the rules by hand was the alternative and is worse: every
hand-copied declaration is a place the port can silently drift from the design.

The bundle itself is committed to `packages/ui/design-system/` for the same
reason the adherence config is — it is the generator's input, so regeneration
has to be reproducible from the repository alone.

### 2. Components are Server Components; interactivity arrives as slots

The design system declares `onFavorite` and `onAdd` on `ProductCard`. A callback
prop forces the component into the client bundle, and with it every product grid
on the site.

The port takes `favorite`, `actions` and `media` as `ReactNode` slots instead.
The card stays server-rendered — so the catalogue is in the HTML for crawlers
and for anyone whose JavaScript has not arrived — and the interactive parts are
ordinary client islands passed in by whichever page actually offers them.

On the homepage neither slot is passed, which is what the design shows: the
canvas hides the footer and the wishlist button with page-level
`display: none !important`. Rendering nothing is better than rendering it and
hiding it.

Four things on the homepage hydrate: the hero carousel, the flash-sale
countdown, the best-seller filter, and the tab bar.

### 3. Prices cross into components as formatted strings

`ProductCard.price` and `TickerItem.price` are `string`, not `number`.

Amounts are `bigint` rials. A bigint cannot cross the server/client boundary,
and converting one to a number to get it there is precisely the precision loss
the money package exists to prevent. So prices are computed and formatted on the
server by `@sharghigold/money`, and only text reaches the browser.

This also means nothing in `packages/ui` can format a price, so nothing there
can format one wrongly. The package has its own `intl.ts` for presentational
numerals — a percentage, a countdown, an item count — and it is documented as
never being for money.

### 4. The homepage computes its prices instead of copying them

The design canvas has a final toman figure baked into each card. Copying those
would have hidden what this page most needs to demonstrate: that a price shown
to a customer is derived on the server from a weight and a gold rate.

So `src/data/demo-catalogue.ts` carries weight, purity and fee rates —
never a price — and `src/lib/catalogue.ts` quotes each product through
`quoteGoldPrice`. The figures on the page therefore differ from the canvas,
which was illustrative. The 1.8g necklace renders ۲۳٬۶۴۶٬۹۶۷ تومان, the same
number the money package's own reference test asserts, and a storefront test
pins the two together.

`src/lib/gold-price.ts` is the single source of the rate, used by both the
ticker and the cards, so the strip cannot advertise one figure while the cards
are priced off another. It reports `isLive: false` and carries an `asOf`, and a
test asserts the flag — which will fail the moment a real feed lands, forcing
whoever wires it up to revisit every staleness decision.

### 5. Discounts reduce the making fee, and the percentage is derived

In this trade a discount is a reduction in اجرت. Gold is worth what gold is
worth; no shop discounts the metal. A promotion is therefore a lower
`makingFeeBasisPoints`, and `wasPrice` is the same piece quoted at the full
rate.

The badge percentage is computed from the difference between the two totals, in
integer arithmetic, floored — so it can understate the saving but never
overstate it. This is why the cards show 4–7% where the canvas showed 10–15%:
15% off the making fee is around 6% off the total. A customer who checks the
arithmetic must never find less off than the card claimed.

### 6. Deviations from the canvas

Each is a correctness or accessibility fix, and each is commented where it
lives.

| Change                                                                                 | Why                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole-card link becomes a title link plus a stretched overlay                          | The canvas wraps the card in an `<a>`, nesting the add-to-cart `<button>` inside a link. Invalid HTML; the button is unreachable in some assistive technology, and Enter can follow the link instead of adding to the basket. |
| Price figure is `white-space: nowrap`                                                  | U+066C, the Persian thousands separator, is a break opportunity for some layout engines. «۱۶۲٬۹۰۱٬۳۳۰» split across two lines reads as two numbers.                                                                           |
| «تومان» sits on its own line in compact cards                                          | Inline, it fits beside an eight-digit figure and drops below a nine-digit one, so a grid ends up with prices at two different heights depending on how heavy each piece is.                                                   |
| Hero slide is `min-block-size`, not a fixed height                                     | At 375px with the fallback font the headline takes a fourth line and the call to action is clipped off the bottom.                                                                                                            |
| Hero image is 40% wide, capped at 158px                                                | The canvas's fixed 158px eats the headline's line length on narrower phones.                                                                                                                                                  |
| Page-level `!important` overrides become a `zn-pcard--compact` modifier                | The canvas restyles cards with page CSS. The same cards appear on category and search pages, so it is a variant of the component, not a property of one page.                                                                 |
| Footer accordions are `<details>`/`<summary>`                                          | No JavaScript, correct roles and keyboard behaviour for free, and the links inside a closed group stay in the HTML where a crawler can follow them.                                                                           |
| Carousel pauses on hover and focus, and never autoplays under `prefers-reduced-motion` | A hero that keeps sliding out from under someone reading it.                                                                                                                                                                  |
| Ticker is a labelled region, not `role="marquee"`                                      | `role="marquee"` makes the strip a live region, so gold prices are re-announced continuously.                                                                                                                                 |
| Tab bar reads the current tab from `usePathname`                                       | The canvas tracks it in component state, which survives a real navigation and is lost on reload.                                                                                                                              |
| A visually hidden `<h1>`                                                               | The canvas has no page title; the wordmark is in the header, where it repeats on every page and so cannot be the h1.                                                                                                          |
| «قیمت پیشین» before a struck-through price                                             | The strike-through is CSS, which most screen readers do not announce; without it the old price reads as a bare number in front of the new one.                                                                                |
| `toPersianDigits` maps `.` to U+066B                                                   | The design system's own helper leaves the ASCII full stop, producing «۰.۸» — Persian numerals with a Latin decimal mark.                                                                                                      |
| Specs render as separate elements                                                      | `·` is bidi-neutral. In one text run between numerals it attaches to the wrong side and «۱۸ عیار · ۱٫۸ گرم» renders as «۱۸۰ عیار» — a different purity. Same reasoning as the `SpecList` fix in ADR 0002.                     |

### 7. `unsafe-eval` in the development CSP only

React's development build uses `eval()` for debugging features; production never
does. The storefront CSP grants `unsafe-eval` only when `NODE_ENV` is
`development`, derived from the environment rather than from a flag that could
be set in a deployment. A production build cannot take that branch.

## Consequences

- The homepage renders as static HTML. Nothing about the catalogue depends on
  hydration.
- Adding a component means porting it against the generated contract; the
  variant types make an undefined variant a compile error.
- Re-importing the design system means replacing `_ds_bundle.js` and running
  both generators. The drift tests fail until that happens.

## Known gaps

- ~~**Fonts.**~~ Closed by ADR 0004 — the 11 `.woff2` files are committed and
  the page now matches the canvas to the pixel. The **licence is still
  unconfirmed**; see `packages/ui/assets/fonts/README.md`.
- **No product photography.** Cards show a labelled placeholder in the media
  slot. `next/image` goes in that slot when images exist.
- **The catalogue is placeholder data.** `demo-catalogue.ts` is deleted when
  `GET /api/v1/products` is real.
- **The newsletter form posts nowhere** and says so; the control is disabled
  rather than silently inert.
- **The basket count renders nothing until there is a basket.** The bubble, its
  styling and the `CartBadge` client island are in place as of ADR 0004;
  `useCartCount()` returns 0 until `GET /api/v1/cart` exists and the bubble
  hides itself at 0, rather than showing the canvas's illustrative «۲».
- **The countdown is a fixed constant.** It has to come from the promotion
  record: a countdown derived from the visitor's own clock can be moved by
  changing the device's time.
- **No component rendering tests, and no visual-regression harness.** What
  matters about this page — that it renders on the server, in RTL, with the
  right numbers, at the design's measurements — was verified against the running
  server rather than against jsdom's approximation of one. ADR 0004 records the
  measurements; nothing yet enforces them automatically. Pure logic is unit
  tested.
