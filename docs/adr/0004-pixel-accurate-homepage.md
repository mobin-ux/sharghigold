# ADR 0004 — Bringing the homepage onto the design, to the pixel

- **Status:** Accepted
- **Date:** 2026-09-08
- **Supersedes:** the "Known gaps" section of ADR 0003, in part.

## Context

ADR 0003 ported the homepage from the `Zarnama Mobile Home` canvas, but it was
built without the webfonts. That is not a cosmetic shortfall: Peyda and AriaWeb
set Persian at different widths and different numeral shapes to the Tahoma
fallback, so the hero headline took four lines against the canvas's two, the
price sizing had been chosen against the wrong face, and the page could not be
compared to the design at all. Several deviations were introduced to work around
that, and were recorded honestly, but they compounded.

The fonts have now been pulled from the design project (see ADR 0002 — the
licence is still outstanding), which made a real comparison possible for the
first time.

## Method

The canvas was rendered locally as a ground truth — the exported `.dc.html`, the
design system bundle, the token CSS and the fonts, served together — and the
implementation was diffed against it numerically rather than by eye:

1. Every top-level section's `y` and `height` in both documents.
2. A landmark probe matching ~30 elements by their exact text across the two
   different DOM shapes (inline styles on one side, classes on the other), then
   comparing box, font-size, weight, line-height and padding for each.
3. Screenshots at matched scroll offsets.

Both documents were measured at 390 × 844 with fonts loaded.

## Result

Every section matches, and so does the document:

| Section        |    y |   height |
| -------------- | ---: | -------: |
| header         |    0 |      122 |
| price ticker   |  122 |       49 |
| hero           |  171 |      216 |
| categories     |  387 |      336 |
| trust strip    |  741 |       67 |
| new arrivals   |  808 |      358 |
| installment    | 1190 |      544 |
| flash sale     | 1757 |      381 |
| best sellers   | 2139 |     1248 |
| shop by weight | 3387 |      407 |
| magazine       | 3793 |      335 |
| newsletter     | 4154 |      147 |
| footer         | 4329 |      704 |
| tab bar        |    — |       65 |
| **document**   |      | **5129** |

## What was actually wrong

Most of it was not "a few pixels out". Four were real defects:

### A design-system class collision

The homepage's bottom navigation used `.zn-tabs` / `.zn-tab` — names the design
system already publishes for its horizontal `Tabs` component. `components.css`
therefore cascaded its `padding` and `font-weight` into the bar. The page's own
rules still won for the properties it set, so nothing looked obviously broken;
the bar was simply 90px tall against the design's 65 and its labels came out
medium rather than regular. Renamed to `.zn-tabbar`.

### A scrollbar in the layout

The card rails and the filter row are horizontal scrollers. A desktop browser
reserves a 15px gutter for their scrollbars and adds it to the height of every
rail; a phone — which is what this page is for — uses overlay scrollbars and
reserves nothing. The canvas suppresses scrollbars for exactly this reason.
Hiding them on those four containers makes the desktop preview agree with the
device rather than changing what a customer sees.

### Section rhythm averaged into one token

The canvas opens the categories and the flash sale at 20px, most sections at
24px and the magazine at 26px, and the gap under each heading varies between 4
and 14px. The port had collapsed all of that onto `--space-5` and `--space-3`.
Those are design decisions and are now preserved, each behind a named modifier.

### A missing panel and the wrong copy

The installment panel had been built without the canvas's illustration, without
its badge row, and with different headline and standfirst copy. The illustration
is now ported as vector — it is drawn entirely from colour tokens, so it re-tints
with the palette and costs no request — and the copy matches.

The rest were type scale (the hero CTA, the countdown, the weight-band label,
the newsletter button and the price on the product card were each one step off),
the footer's link rows taking the inherited 16px body leading instead of their
own 12.5px, and the first footer group not opening on load.

## Deviations kept, and why

These are the only places the implementation deliberately differs.

### Prices are computed, not copied

The canvas's figures are illustrative. Every price on this page is derived on
the server from a weight and a gold rate by `@sharghigold/money`, so they read
differently — «۱۰۳٬۶۷۹٬۲۰۵» where the canvas shows «۷۹٬۹۰۰٬۰۰۰» — and the
discount percentages, being derived from the difference between two totals,
differ too. This is ADR 0003 §4 and it stands: a price that was typed in once is
a price that is wrong the next time gold moves.

### The basket bubble renders nothing until there is a basket

The canvas draws «۲» on the basket icon and the basket tab. The markup, the
styling and the client island are all in place (`CartBadge`), but
`useCartCount()` returns 0 until `GET /api/v1/cart` exists, and the bubble hides
itself at 0. Hard-coding a 2 would tell a customer they have two items they do
not have. When the basket lands, only `use-cart-count.ts` changes.

### No drop-target ring on the image placeholders

The canvas's image areas are `<image-slot>` elements — the design tool's
"drag an image here" control. Its tint, its 28px glyph and its caption are
reproduced; its dashed drop-target ring is not, because that is editor chrome
rather than a design decision.

### The whole installment panel is not one link

The canvas wraps the entire panel — heading, standfirst, four promise chips and
button — in a single `<a>`. That is announced as one enormous link whose name is
all of that text, and it makes the chips unselectable. The link is the button;
an `::after` overlay restores the whole-panel hit area.

### The newsletter's "not live yet" note is screen-reader only

The canvas has no status line, and a visible one pushes the panel 29px past the
design. The control stays disabled and the explanation stays in the
accessibility tree, where a disabled control with no stated reason is far more
confusing than it is for a sighted user, who at least sees it greyed.

## Consequences

- The homepage can now be regression-checked against the canvas by measurement,
  not opinion. The table above is the reference.
- The remaining gap is a **visual-regression harness** — the comparison above was
  done by hand and nothing stops it drifting. That is the natural next piece of
  work, alongside the API end-to-end tests.
- Every product image is still a placeholder. `next/image` drops into the media
  slot on `ProductCard`, the hero and the magazine card without touching layout.
