# ADR 0005 — The category browser, and getting the catalogue out of React

- **Status:** Accepted
- **Date:** 2026-09-08

## Context

The `Zarnama Categories` canvas is the second page of the storefront and the
first one that is not a single scrolling document: it is an app shell with a
pinned search bar, a pinned tab bar, and two columns between them that scroll
independently.

It is also the first page whose content is _catalogue structure_ rather than
layout. Eight categories, each with five or six groups of facet tiles — sub-types,
price bands, weight bands, promotions, instalment terms. Roughly 190 tiles in
all. None of that is a design decision; all of it is merchandising, and it
changes without a deploy.

## Decisions

### The catalogue is data, behind a gateway

`@sharghigold/contracts` gains `catalogue.ts`: `CategoryNavigation`, its
entries, facet groups and tiles. The storefront reads it through one function,
`getCategoryNavigation()`, which parses whatever it is given against that
schema before returning it.

Today the source is a literal in `server/catalogue/taxonomy.ts`. When
`GET /api/v1/categories` exists, only the body of `loadNavigation` changes — it
becomes a `fetch` parsed by the same schema. Nothing above the gateway knows
the difference, and no component imports the fixture.

The parse is not ceremony. A fixture that has drifted from the contract and a
server that has drifted from the contract are the same bug, and catching it at
the boundary is the difference between a failed request and a blank tile three
components away that nobody notices for a month.

### Artwork is not data

Each tile names an `icon` — `earring.hoop`, `weight.scale-2` — and the
storefront maps that key to a drawing it owns. The key is constrained to dotted
lower-case segments by the schema.

This split is deliberate. A vector illustration cannot be authored in an admin
form, and putting SVG paths behind an API would let whoever edits a category
inject markup into every customer's page. An unknown key falls back to a
neutral mark rather than collapsing the tile and taking the row's alignment
with it.

### The marks are ported as generators, not as path data

The canvas does not draw these illustrations by hand — it builds them from a
small set of functions, so a coin at 5.4 units and a coin at 9.2 are one
drawing at two radii. `components/marks/paths.ts` ports those functions rather
than flattening their output into literal strings, because the arithmetic _is_
the design: a hand-copied `17.444871` is a transcription waiting to drift, and
a generator can be unit-tested where a wall of path data cannot.

### The rail is a tab list, not a set of links

The canvas marks the active category with `aria-current`, which describes
_location_ — it would tell a screen-reader user this is the page they are on,
when in fact it is the one of eight that is showing. `role="tab"` with
`aria-selected` says what is true and brings the keyboard behaviour that goes
with it: arrows move, Home and End jump, and Tab leaves the list instead of
walking through all eight. Selection follows focus, which is right when
switching costs nothing.

### The whole catalogue is sent, and switching is local

The page server-renders every category and hands the lot to one client
component. Switching is local state, so a tap repaints immediately — which is
the interaction the canvas designs for, and a browser you have to wait on is a
different and worse thing. It also puts every facet link in the initial HTML,
which is what makes the tree crawlable.

The chosen category is mirrored into `?category=` with `replaceState`, so the
view is shareable without burying the page the customer arrived from under
eight history entries. A deep link is read on the server, matched against known
slugs only, and falls back to the first category — a stale link lands on a
working page rather than a 404.

## Result

Measured against a rendered copy of the canvas at 390 × 844, with fonts loaded:

| Element                 |    Design | Implementation |
| ----------------------- | --------: | -------------: |
| shell                   |       844 |            844 |
| search bar              |        64 |             64 |
| body                    |       715 |            715 |
| tab bar                 |        65 |             65 |
| panel / rail width      |    308/82 |         308/82 |
| panel content (earring) |      1697 |           1697 |
| panel content (coins)   |      1914 |           1914 |
| sticky head             |        70 |             70 |
| instalment banner       |        68 |             68 |
| facet group             |       303 |            303 |
| facet grid              |       250 |            250 |
| tile / mark / label     | 106/74/25 |      106/74/25 |
| rail item               |        71 |             71 |

Every typographic and colour value matches too. All ~190 tile drawings were
compared by hashing their serialised path data: six of the eight categories are
byte-identical, and the three tiles that differ textually are the heart shapes,
where the canvas writes `scale(.68)` and the generator emits `scale(0.68)`.
Their rendered geometry was measured on both sides and is identical.

### Three defects found by measuring

- **The tab bar had no styles on any page but the homepage.** `.zn-tabbar` and
  `.zn-cartbadge` lived in `home.css`, so a shared component was styled only
  where it happened to have been written. They are now in `shell.css`, loaded
  from the root layout.
- **`--space-2` is 8px; the rail's gap is 6.** Two pixels per item, and the
  rail is eight items.
- **A button's user-agent padding is `1px 6px`.** Setting only the inline axis
  left the block axis at 1px.

## Deviations kept, and why

- **The instalment banner links per category** (`/installment?category=…`)
  rather than to the bare page the canvas points at. The customer asked about
  instalments _on gold bangles_; throwing that away is a worse landing.
- **The search placeholder is at full-strength `--teal-100`.** The canvas
  leaves it at the browser default, which lands near 54% against `--teal-600` —
  below the contrast floor the design system sets for itself.
- **Facet tiles do not prefetch.** A category shows up to twenty-eight tiles and
  a customer follows one; prefetching each as it scrolled into view fetched two
  dozen listings to discard, which on mobile data is somebody's money.
- **The panel head's `z-index` is scoped.** The canvas uses `5`; using the
  app-wide sticky token here would overstate what it needs to clear.

## Consequences

- `/categories/[slug]` — the listing page — is the obvious next piece of work.
  Until it exists, every facet tile, the «مشاهده همه» link and the instalment
  banner lead to a 404, as do `/cart`, `/account`, `/installment` and `/search`
  from the shared chrome.
- The route is dynamic (`ƒ`) because it reads `searchParams`. That is the price
  of server-rendering deep links, and is worth paying while the catalogue is
  cheap to produce; it will want a cache once a database is behind it.
- The homepage's own category grid is still a literal in `category-grid.tsx`.
  It now shares the mark registry, but the six featured categories are
  merchandising and belong behind the same gateway.
