# ADR 0011 — The category listing

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

`/categories/:slug` existed since ADR 0010, built without a design: a page
heading, a row of sub-type chips, and the shared sort links, filter chips and
pager. The `Zarnama Category` canvas now draws it: a teal header with a trail,
a rail of sub-type tiles, a sticky toolbar with filter and sort sheets and
quick-filter chips, the grid, «نمایش کالاهای بیشتر», an instalment banner and a
buying guide.

## Decisions

### One listing screen, three routes

The toolbar and results are components (`components/catalogue/`) that
`/categories/:slug`, `/products` and `/search` all render. The category page
adds the header, rail, banner and guide; the other two keep the site header,
and their toolbar does not stick. The old sort row, removable chips and pager
are gone rather than kept beside the new controls.

### Every control is still a URL

The sheets open in a client island, but what they apply is a link built by the
same `listingHref` the server uses. The filter sheet holds a draft while open
and applies it once — the canvas applies each tap, which would reload the grid
and push a history entry per chip. Its «نمایش ۱۲ کالا» count is the draft's,
fetched from `GET /api/products/count`, because it depends on prices only the
server computes.

«Load more» is `?page=N` on a cumulative listing (`listProducts(query,
{ cumulative: true })`): pages one to N on one screen, restorable from the URL,
working before hydration.

A model is a path, not a parameter — `/categories/earrings-drop` is that tile's
page — so model chips in the sheet are single-choice. A sub-type counts as one
filter in the badge, and «حذف فیلترها» widens back to the category.

### What the contract gained

- `discount-desc`, ordering by the share taken off, compared as fractions so
  two offers that both print «۱۰٪» are not tied by rounding.
- `freeShipping`: pieces whose own price is above checkout's
  `FREE_SHIPPING_ABOVE_RIALS`, so a piece listed as shipping free is one that
  does.
- The default sort is `newest`, as the canvas has it.
- The search term no longer counts as a filter: on `/search` it is the page,
  and a badge reading «۱» before anything was touched is wrong. Clearing
  filters keeps it.

### Words are content, not taxonomy

Headings, the banner's noun and the guides live in
`server/content/category-copy.ts`, apart from the taxonomy, because different
people will own them in the admin panel. Every guide states this shop's actual
formula — VAT on the making fee and profit only — and a category without copy
gets its title as a heading and no guide.

### The bottom sheet is shared

`BottomSheet` moved from `components/product/` to `components/`, its styles to
`app/sheet.css` loaded by the layout, and it gained a pinned `footer`, `flush`
and `list` bodies, and a lower `capped` height.

## Where it departs from the canvas

- **No «مناسب برای» facet.** No product carries daily/gift/occasion data, and a
  filter over data that does not exist would match nothing or everything.
- **The banner's terms are the real ones.** «تا ۳۶ ماه» becomes
  `INSTALLMENT_HINT` (40% deposit, up to 18 months), which wraps to two lines at
  320px.
- **The trail is honest.** «طلای ۱۸ عیار» is not a page; the middle crumb is
  «دسته‌بندی‌ها» on a category and the parent category on a sub-type.
- **Search is a link**, and back goes to the parent, not `history.back()`.
- **The toolbar sticks at 88px**, the header's height; the canvas's 96px leaves
  a slit the grid scrolls through.
- **The price slider's end labels are swapped.** A right-to-left range runs from
  its minimum on the right; the canvas put «۱۰ میلیون» under the thumb at 140.
- **Twelve cards per page**, the contract's `LISTING_PAGE_SIZE`, not six.
- **Rail tiles draw the sub-type marks** the category browser uses instead of
  the canvas's placeholder disc.

## What measurement found

Rendered at 390 × 844 beside the canvas, fonts loaded:

| element                  | canvas      | build       |
| ------------------------ | ----------- | ----------- |
| header                   | 88.4        | 88.4        |
| sub-type rail            | 103.8       | 103.8       |
| rail tile / item         | 64 / 85.8   | 64 / 85.8   |
| toolbar (row + chips)    | 106.8       | 106.8       |
| count row                | 38.1        | 38.1        |
| grid top                 | 337         | 337.1       |
| card media               | 142.2       | 142.4       |
| card body                | 127.8       | 127.8       |
| filter sheet head / foot | 64.8 / 78.8 | 64.8 / 78.8 |
| facet section            | 105.6       | 105.6       |
| sort sheet / row         | 340.8 / 50  | 340.8 / 50  |

The card body was 2px tall until the grid overrode the shared compact card's
16px bottom padding with this canvas's 14px. The «ارسال رایگان» chip is 4px
wider than the canvas's: the canvas draws it as a `<button>`, which takes the
form-control font feature; here it is a link. No element overflows at 320px.
