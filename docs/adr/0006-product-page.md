# ADR 0006 — The product page, and a price that is derived rather than stored

- **Status:** Accepted
- **Date:** 2026-09-10

## Context

`Zarnama Product` is the page a customer decides on. It is also the first page
in this build that shows money: a total, a breakdown of how that total was
reached, a countdown for how long it stands, and an instalment figure derived
from it.

The canvas is a single `.dc.html` file holding five screens — the product, the
reviews, the review form, the buyer questions, and the delivery-and-returns
terms — switched by a `view` field in component state, plus two bottom sheets.
It computes the price in the browser:

```js
const RATE = 10480000,
  WEIGHT = 2.8,
  WAGE = 0.18,
  PROFIT = 0.07,
  VAT = 0.09;
const base = RATE * WEIGHT;
const wage = base * WAGE;
```

That is the right amount of machinery for a drawing and the wrong amount for a
shop.

## Decisions

### The price is computed on the server, in integers, every time

`server/catalogue/pricing.ts` is the only place a sellable figure is produced.
It uses `@sharghigold/money`: whole rials and whole milligrams as `bigint`, with
each line rounded to a whole rial as it is computed. Nothing on the page does
arithmetic on money, and no component receives a number it could add to another
one — amounts arrive as digit strings and are formatted once.

The consequence worth stating: **the product record carries no price at all.**
It holds a weight, a purity and three rates, and the figure is derived from
those on every render. There is no stored total to go stale against a rate
change, and nothing a request body could overwrite.

The breakdown is not decoration either. It re-adds to the total exactly, which
a test asserts, because a customer who can check the working is a customer the
shop can be held to — and because VAT applying to the making fee and the profit
but never to the metal is the rule most often implemented wrongly in this trade.

### A quote is a total and an expiry, not a number

The canvas draws a five-minute countdown and loops it back to 5:00 when it runs
out. Here the quote carries `expiresAt`, the page counts down to that instant,
and when it passes the page asks the server for a new quote rather than leaving
an expired figure on screen. Counting down to a deadline rather than
decrementing also means a tab that was backgrounded for two minutes comes back
showing the truth.

`secondsRemaining` is sent alongside `expiresAt` so the first client render
produces exactly the string the server sent. Deriving it from `Date.now()` in
the browser is a hydration mismatch on the most important number on the page.

The instalment figure is rounded **up** to a whole toman and taken as the
largest of an exact split, so paying the quoted amount every month always
clears the price. Rounding it down leaves a final instalment a few toman short
— the shop's rounding error to absorb, not the customer's to discover.

### The five screens are five routes

`/products/[slug]`, `…/reviews`, `…/reviews/new`, `…/questions`,
`…/shipping`. The canvas has to fake routing because it is one file; a real
application should not inherit that.

Reviews and buyer questions are the sentences people type into a search engine
before buying, and a filtered list that lives only in component state has no
URL, no back button, and nothing for a crawler to index. Making them routes
also puts the review filter and sort in the query string, where the server
parses them into a closed set before they reach anything — which is the whole
point of `reviewQuerySchema`.

### Reviews are filtered, sorted and truncated on the server

The canvas sends every review to the browser and hides most of them. That puts
the whole set in the page source and makes «filtered» a description of what is
painted rather than of what was sent. Here the query is parsed, applied and
limited server-side; `matched` and `total` come back so the page can say how
much of what it is showing.

Display names arrive already shortened — «مریم ر.», never «مریم رستمی». The
storefront is not sent a full name to truncate, because a name that reaches the
page can be read out of the HTML whatever the component chose to render.

### Submissions are refused rather than faked

There is no reviews service and no session to attach a submission to, so a
review or a question cannot be stored and cannot be tied to a paid order.

The Server Actions are real: they re-parse the whole submission against the
shared contract, keep the draft so a rejection does not cost the customer their
words, and hand the result to `postSubmission`. What that does when no API is
configured is say so. A form that answers «ثبت شد» while writing to nothing is
worse than one that says it cannot take the message — the customer walks away
believing they have been heard.

### The controls are the platform's

Colours, sizes, instalment terms and both star pickers are radio groups made of
real radio inputs; the sheets are `<dialog>` opened with `showModal()`. The
canvas uses `<button>` for all of them and positioned `<div>`s for the sheets.

The difference is not tidiness. The radio group brings arrow-key navigation,
the «۳ از ۶» announcement and a form payload for nothing; `showModal()` brings
the inert background, the focus trap and the Escape key for nothing. Written
the canvas's way, each of those is code somebody has to write and keep right.

## Result

Measured against a rendered copy of the canvas at 390 × 844, with fonts loaded.
Every figure below is identical on both sides.

| Screen               | Canvas | Implementation |
| -------------------- | -----: | -------------: |
| product page         |   3823 |           3823 |
| reviews              |   1935 |           1935 |
| review form          |   1406 |           1406 |
| buyer questions      |   1307 |           1307 |
| delivery and returns |   1401 |           1401 |

Section by section on the product page — breadcrumb 32.4, gallery 402, title
110.6, colour 93.9, size 153.4, price 224.1, instalments 238.1, assurances
271.5, seller 71.3, jump bar 46.8, specifications 254.9, description 178.8,
reviews 571.3, links 225.6, questions 316.3, related 345.8, tail 28; header
56.8 and buy bar 67.8. Ninety-five of the page's text runs match the canvas
exactly on width, height, size, weight, colour and family.

### Four defects found by measuring

- **Form controls lose the brand's stylistic set.** `base.css` turns on
  `font-feature-settings: 'ss01' 1` at the body, which in Peyda selects the
  Persian forms of kaf and gaf. The user agent applies a `font` shorthand to
  buttons and inputs, and the shorthand resets the property; declaring a
  `font-family` afterwards does not bring it back. So the same Persian word is
  drawn one way in a paragraph and another inside a button — «رزگلد» is about
  5px narrower in the colour picker than anywhere else. Fixed in
  `extensions.css` for every control, which is a deliberate divergence from the
  canvas: the canvas has the split too.
- **`<MediaPlaceholder>` had no styles outside the homepage.** Its rules lived
  in `home.css`, so a component used by the homepage rails, the product gallery
  and the review photographs was styled only where it happened to be written.
  This is the third instance of that pattern; `.zn-shell` and `.zn-pagemsg`
  moved to `shell.css` in the same pass.
- **Heading elements carry the display leading.** `base.css` gives `h1`–`h4`
  `--lh-snug`. Where the canvas sets a plain label and the port uses a heading
  for the outline, that is 6.75px of missing height per heading — enough to
  move a whole card.
- **The seller's reply is a rule, not a box.** The canvas marks it with
  `border-inline-start: 3px solid var(--gold-500)`; a full border makes it a
  second card inside the first, and is 1.6px taller.

## Deviations kept, and why

- **The gold rate is not called «lively».** The canvas labels the rate strip
  «نرخ لحظه‌ای» and blinks a dot beside it. There is no market feed yet, so the
  strip says «نرخ مرجع» and the dot does not blink until `isLive` is true.
  Showing a stale figure as a live one is the failure mode `gold-price.ts`
  exists to prevent.
- **The rating and the review count are derived, so they differ.** The canvas
  shows «۴٫۸ از ۱۲۴ نظر» against bars of 82/12/4/1/1 — a distribution whose own
  mean is 4.73. Here both come from the reviews themselves and cannot disagree
  with the list underneath them.
- **Names are shortened, and the canvas's are not.** The reviews on the canvas
  carry full names while its Q&A carries initials. Initials everywhere.
- **The header title only fades in on the product page.** The canvas fades it in
  on all five, which leaves the four sub-pages briefly untitled.
- **The sub-links are links.** The canvas makes all four buttons and navigates
  with `window.location`, which costs the middle-click, the long-press menu, the
  hover preview and the crawler.
- **Photo upload slots are drawn and disabled.** Uploads need a store and a
  virus scan. A slot that silently accepts a file and drops it is worse than one
  that says it is not ready.

## Consequences

- **The quote is unsigned and uncounted.** It has no id, nothing verifies it,
  and the cart does not exist. When `POST /api/v1/cart` lands it must re-quote
  from the weight and the live rate and charge that, treating anything the
  browser sends as a display echo. The seam is in place; the control is not.
- **`PRICE_QUOTE_TTL_SECONDS` in `.env.example` is 900 and the page's lock is 300.** They describe different windows today — the checkout quote and the
  display lock — but nothing enforces that reading, and two systems disagreeing
  about how long a price stands is a bug waiting to be written.
- The route is dynamic (`ƒ`) because every render strikes a fresh quote. That
  is the price of the countdown being true.
- `/checkout`, `/contact`, `/about`, `/installment` and `/categories/[slug]` are
  linked from these pages and do not exist yet.
- Five products are written out in full. Every other product the homepage links
  to still 404s, and will until the catalogue API is behind `getProduct()`.
