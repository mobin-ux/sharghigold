# ADR 0009 — The basket, and an order that is priced by the shop

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

`Zarnama Cart` is six screens in one file: the basket, the pieces saved for
later, how the order is received, how it is paid for, a review, and the result.
It is the first page in this build where a customer chooses what to buy and the
shop has to charge for it.

The canvas does all of that in the browser. The basket is an array in component
state, the prices come from `RATE * WEIGHT` and a chain of `* 0.18`, stock is a
number on a literal, and the ending is chosen like this:

```js
const ok = !(this.props.paymentFails ?? false);
this.setState({ result: ok ? { ok: true, … } : { ok: false, … } });
this.go('result');
```

That is the right amount of machinery for a drawing. For a page that takes
money for gold it is every mistake at once, and the mistakes compound: a total
computed in the browser is a total the browser can change, and a stock count
held beside it is a shelf that can be emptied twice.

## Decisions

### The basket holds choices; the shop holds prices

A basket line is a product, a size, a colour and a quantity. It carries no
price and there is no schema in `contracts/cart.ts` that would accept one —
`addToCartSchema` has four fields and none of them is money. Every rial the
screens show is produced by `server/cart/pricing.ts` from the catalogue, the
product's own weight and rates, and the basket's locked gold rate.

This is the single most important line in the file, because a basket is the one
place in a shop where the customer controls the input and the output is money.

### The price lock is on the basket, not on the render

A quote re-struck on every page load never expires, and a lock that never
expires is decoration. So the rate and the instant it was taken live on the
basket record. The countdown resumes where the lock actually is, `refreshRate`
is the only thing that moves it, and `placeOrder` refuses an order against an
expired one.

Confirmed in the browser rather than assumed: leaving the tab for five minutes
and pressing on sends the customer back to the basket with the design's own
sentence, and the refresh button is what lets them through.

### The bill is quoted in the unit the shop charges in

The making fee is the only part of an Iranian gold price a shop can discount —
the gold is the market's and the VAT is the state's — so `ZARNAMA10` reduces
the fee, and the profit and the VAT that _derive_ from the fee come down with
it. `quoteGoldPrice` gained a `makingFeeDiscount` parameter rather than having
the subtraction done afterwards, because charging VAT on a fee nobody paid
overcharges the customer on every discounted order.

The discount is then allocated across the lines in proportion to their fees, so
the parts add back to the whole exactly instead of each rounding on its own.

Measuring the rendered page found the other half of this. Every figure was
computed to the rial and rounded to a toman _by the formatter_, which truncates
— so five lines printed a total one toman below the total printed under them. A
customer who checks the arithmetic finds the shop cannot do it. Each part of a
quote is now rounded to a whole toman where it is computed, and the totals are
the sum of what is shown. A test asserts the bill re-adds under every
combination of code, wrapping and delivery.

### Stock is its own thing, and it moves once

`server/inventory/stock.ts` is separate from the product for the reason
`packages/database` already models `InventoryItem` separately: a product is a
description that changes when somebody edits it, and stock is a count that
changes when somebody buys something.

`reserve` takes the whole basket or none of it, checked in full before anything
is written, so a basket whose last line is short leaves the first lines
untouched. Nothing is taken while a basket merely _holds_ a piece — browsing
would empty the shop — and a payment that fails puts back exactly what it took.

The stepper's cap is a courtesy. Asking for nine of a ring the shop has four of
was tried with the cap removed: the server clamped it to four and said why.

### The checkout draft is held on the server

Which address, which branch, which window, which payment method: each is
written by the screen that owns it and stored against the customer. The
alternative is carrying the whole thing forward in hidden fields, and a hidden
field naming an address is a field that can name somebody else's.

Every setter resolves what it is given inside the viewer's own rows or against
the shop's own policy tables. An id that matches nothing is ignored — the same
answer as one belonging to another customer, which is what stops the refusal
being a confirmation that the id exists.

### Collection windows are generated, not written down

The canvas offers «۵ شهریور ۱۰ تا ۱۳» from a literal array. A fixed list of
dates is a list that offers yesterday. `collectionSlots` builds them from the
clock in Tehran time, drops a window there is no longer time to reach, and
skips the days a branch is shut — and `findCollectionSlot` does not recognise
one it is no longer offering, so a booking cannot sit on a draft and become an
appointment nobody will keep.

### Pressing pay twice places one order

The review screen mints a one-shot token, and `placeOrder` spends it inside the
same synchronous pass that reserves the stock. A repeat of _that_ token is
answered with the order it made; a token from any other render is stale. The
pair is stored together — the token that was spent and the code it produced —
because answering a stale token with an order the customer placed last week
would be worse than refusing it.

Writing the test for this found the first version wrong: the draft was deleted
on success, so the second press had nothing to answer with and reported an
error over an order that had gone through.

### The outcome is asked for, never received

Settlement asks `server/wallet/psp.ts` what happened, exactly as the wallet
top-up does. The shop is never _told_ an outcome by a browser, because in a
real integration that is the parameter an attacker forges. `settleOrder` is
already a separate, idempotent function: when there is a bank to be redirected
to, the customer comes back to a page that calls it and nothing above it
changes.

### The wallet pays in full or not at all

The design draws «کیف پول + درگاه بانکی» for a wallet that does not cover the
order. A part-payment split across a wallet and a card is two settlements that
have to succeed or fail together, and getting that wrong debits a customer for
an order they never received. So the wallet is offered only when it covers the
order; below that it is shown with the shortfall and the top-up link the design
already draws, and refused again on the server.

Tried with the disabled radio re-enabled: the order was refused, the wallet was
untouched, and the stock it had reserved came straight back.

### Native controls, again

Every choice on these screens is a real radio in a real fieldset, and the
selected look is a `:has(input:checked)` rule. The canvas draws them as buttons
with `role="radio"` and `aria-pressed`, which looks the same and gives up arrow
keys, a group name and a checked state the platform already knows how to
announce. One line of client JavaScript posts the group when the selection
changes; without it the `<noscript>` button posts the same selection, so the
island improves a page that already works rather than being what makes it work.

The quantity stepper is two submit buttons in a form. The number lives in the
basket on the server, which is where it has to live anyway — a quantity kept in
a browser disagrees with the basket the moment a second tab is open.

### One instalment policy, quoted everywhere

The canvas's checkout offers a 40% deposit over 6, 12 or 18 months with a
surcharge; the product page already advertised no deposit over 12, 24 or 36.
Shipping both would mean the shop quoting two different terms for the same
ring. `server/policy/installments.ts` is now the only place an instalment is
priced, the product page's «قسط ماهانه» reads from it, and the FAQ that
promised no deposit was corrected.

## What measurement found

Every screen was rendered at 390×844 beside the canvas and diffed block by
block. All five match:

| screen   | block          | canvas | built |
| -------- | -------------- | ------ | ----- |
| cart     | rate band      | 132.3  | 132.3 |
| cart     | lines          | 624.6  | 625.3 |
| cart     | bill           | 347.4  | 347.4 |
| saved    | whole screen   | 366    | 366   |
| delivery | address column | 485.5  | 485.5 |
| delivery | extras card    | 148.7  | 148.6 |
| payment  | methods        | 341.3  | 341.3 |
| review   | cards          | 328.8  | 328.8 |
| result   | hero           | 230    | 230   |

One difference accounts for almost every miss found on the way. The canvas
draws its cards as `<button>` elements, so the text inside them sits on the
browser's own leading; a `<label>` inherits the body's, which is three pixels
taller a line — a whole card's worth down a list of them. Each affected class
now states its leading rather than relying on which element it happens to be.

Two deliberate departures. The result screen keeps the bank's reference on a
successful payment, which the canvas shows only on a failure, because that is
the number a customer quotes to their bank. And the review screen carries a
development-only control over the simulated ending, which the design does not
have.

## What this leaves open

- **The provider.** There is no merchant account and no callback URL. A real
  integration replaces `psp.ts` and moves `settleOrder` behind a return page.
- **A basket before signing in.** The basket belongs to a customer, so `/cart`
  requires a session. A guest basket needs its own opaque identity and a merge
  on sign-in; neither is built.
- **Part-payment**, as above, and **refunds**: a failed order gives everything
  back, but an order that succeeded and must be reversed has no path.
- **Instalments are priced, not underwritten.** Choosing the term and paying
  the deposit works; the credit check, the agreement and the schedule the shop
  would have to enforce do not exist.
- **Stock and baskets are maps**, as ADR 0007 records of the account store, and
  are honest only because the production guard refuses to serve them.
- `/checkout/orders/[code]` is the only view of an order. The account's order
  list links to a detail page that is still not built.
