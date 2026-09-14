# ADR 0012 — The instalment page

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

`/installment` existed as a plain terms page with a GET-form calculator. The
`Zarnama Installment` canvas now draws it: a teal hero, four promises, a
three-step calculator with a schedule, the buying steps, eligibility, the gold
rate, a rail of pieces, costs, questions, a callback form, lending partners,
reviews and a sticky quote bar above the tab bar.

The canvas describes a different product from the one checkout sells. It offers
five terms up to 36 months at annual rates, a deposit the customer picks with a
minimum per term, an instant credit check with its own application form and an
approval screen, a monthly application quota, lending partners, approval
statistics and named reviews. The shop sells one agreement
(`config/commerce-terms.ts`): 40% deposit at order, 6, 12 or 18 months, a 2%
monthly surcharge on the balance, and identity and credit checks after the
deposit (`INSTALLMENT_NOTE`).

## Decisions

### The page draws the shop's terms, in the canvas's layout

A page that quotes terms checkout does not honour is the shop advertising a
price it will not charge. Every figure on the page is read from the terms
config or the checkout policy, and a test fails if the copy mentions 36 months,
instant approval, a penalty-free settlement or a central-bank rate.

### The quote is the server's, and the URL is the calculator

`?amount=…&months=…` is read by `server/policy/installment-calculator.ts`,
which prices through `priceInstallment`, the function checkout charges with.
The quick amounts and the terms are links; the amount is a `method="get"` form;
typing replaces the URL after a 400 ms pause. So a quote can be shared, the page
works before hydration, and no money is divided in the browser.

A hand-edited amount never fails the page: outside the contract's range it
prices the nearest bound and says so under the field, and a term the shop does
not offer falls back to 12 months.

The field keeps what was typed while a quote is in flight. It remembers the
last amount it asked for, so a slow answer for «8» does not overwrite «85000000»,
while a quote that arrived by a link does replace the field.

### The words are content

Headings, steps, eligibility, costs and questions live in
`server/content/installment-copy.ts` for the admin panel to own. The
eligible-categories answer comes from the taxonomy.

### The callback form is real

«درخواست تماس» posts to a Server Action. The action bounds the input,
rate-limits by number (`marketing:callback`, 3 per hour), parses the number with
the shared contract, and queues it in `server/marketing/callbacks.ts`. A repeat
request gets the same answer as a first one, so the form cannot reveal whether a
number is known.

## Where it departs from the canvas

- **No credit application sheet, credit check or approval screen.** The shop
  checks identity and credit after the deposit, inside checkout. The canvas's
  sheet would collect national IDs on a marketing page and then approve on a
  timer. Both calls to action go to the instalment-eligible listing instead,
  with a line saying instalments are chosen at payment.
- **The deposit is a fact, not a choice.** Step 2 shows the 40% chip with its
  amount beside it, where the canvas has five chips.
- **Three terms**, each labelled with the surcharge it adds (`کارمزد ۲۴٪`), not
  five with annual rates.
- **Schedule rows are counted, not dated** (`ماه ۳ از ۱۲`): no due date exists
  before an order is delivered.
- **Removed, because no data exists for them:** the capacity alert, the approval
  and review-time statistics, the named reviews, and the lending-partner
  carousel with its disclaimer. The shop is the seller and the creditor.
- **The rate card does not pulse or show a daily change.** The rate source
  reports `isLive: false`, so the card shows when the figure was taken. The
  countdown pill becomes a link, in the same pill style, to the gold-price page:
  nothing on this page has a locked quote to count down.
- **Promises and costs are the policy's.** «تحویل فوری پس از تأیید» becomes
  insured delivery across Iran. Delivery is free above the checkout threshold
  (20 million toman), not always. Late-payment and early-settlement rows are
  gone because no such policy exists.
- **Trust badges** are the union licence, the authenticity guarantee and the
  official invoice. The e-trust seal is still a placeholder in the footer.
- **The product rail uses the compact card** the home rails use. The canvas
  hint for it is 168 × 268, but it renders the full card at 418px.
- **The hero picture** is the catalogue's bangle mark on a deeper teal, not an
  empty image slot.
- **Header and quote bar:** back goes to the homepage. In the quote bar, the dot
  between «قسط ماهانه» and the count gets margin, because beside Persian digits
  it read as a zero («۱۲۰ قسط»).

## What measurement found

Rendered at 390 × 844 beside the canvas, with fonts loaded:

| element             | canvas    | build     |
| ------------------- | --------- | --------- |
| header              | 56.8      | 56.8      |
| hero                | 322.5     | 322.5     |
| promises grid       | 131.4     | 131.4     |
| calculator section  | 926.2     | 926.2     |
| calculator card     | 823.6     | 823.6     |
| amount field / msg  | 52 / 19.2 | 52 / 19.2 |
| result panel        | 259       | 259       |
| steps section       | 363.3     | 363.3     |
| eligibility section | 319       | 319       |
| rate section        | 236.1     | 236.1     |
| costs section       | 315       | 315       |
| questions section   | 397.7     | 397.7     |
| callback section    | 213.1     | 213.1     |
| trust section       | 353.4     | 353.4     |
| quote bar           | 68.8      | 68.8      |

The product rail is 331.9 against 482.7 (the compact card, above). The capacity
alert's 114.8 is absent. At 320px nothing overflows, and the quote bar rests on
the tab bar at the end of the page.
