# ADR 0008 — Topping up the wallet, and a payment that is asked about rather than told

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

`Zarnama Wallet Topup` is three screens: choose an amount and a method, wait at
the bank, read the receipt. It is the first page in this build where money
leaves a customer's account rather than being quoted at them.

The canvas holds all three in one file, switched by a `screen` field, and
decides the outcome in the browser:

```js
this.t = setTimeout(() => {
  const outcome = this.props.simulateOutcome || this.state.outcome;
  this.setState((s) => ({
    screen: 'result',
    balance: outcome === 'success' ? s.balance + v : s.balance,
  }));
}, 1800);
```

The balance is a number in component state, the amount is `parseInt`, the
tracking number is the constant «۸۲۴۹۱۰۳۷», and «check again» on a pending
payment is written as `setState({outcome: 'success'})` — it does not ask
anything, it simply decides the payment worked.

That is the right amount of machinery for a drawing. For a page that charges a
card it is every mistake at once.

## Decisions

### The amount is converted once, on the server, in integers

The customer types tomans because that is what an Iranian shop quotes. The
ledger holds rials because that is what the currency is. `tomanToRials`
multiplies a string of digits by `RIALS_PER_TOMAN` as a `bigint`, so the
conversion is exact at any magnitude and identical on every platform — pinned
by a test that converts a figure a double cannot represent.

The limits are stated in rials in the contract (`TOP_UP_MIN_RIALS`,
`TOP_UP_MAX_RIALS`) and checked there, against the converted figure. The form's
disabled button is a courtesy; the refusal is the server's, and a request that
bypasses the button gets the same sentence the design writes.

### The amount is fixed when the payment is created, and never read again

`startTopUp` writes the rial figure onto the payment record before the customer
leaves for the bank. Nothing downstream takes an amount from a request: the
settlement path carries a payment id and nothing else, and the figure that is
credited is read from the row. A form field saying how much to credit is
exactly the field somebody edits.

### The outcome is asked for, never received

`server/wallet/psp.ts` stands where a provider would. Authorising returns an
opaque handle; the outcome is decided on the provider's side and read back by
asking. The shop is never _told_ what happened by a browser, because in a real
integration an outcome in the request body is the parameter an attacker forges.

The provider's records live under their own key on `globalThis`, deliberately
outside the shop's tables, so that code which could read the decision out of
its own store is code that never learns to ask.

Like the account store, it refuses outright when `NODE_ENV` is `production`
rather than pretending to take money.

### Settling is idempotent, and the credit happens with the status change

`settlePayment` lives in the store, refuses a payment that is not `pending`,
and applies the credit and the status in one synchronous pass. A customer who
refreshes the return page, presses back, or opens the link again an hour later
calls settlement again and gets the same receipt; the wallet moves once. When
the database replaces the store the same pass becomes one transaction with the
row locked — the shape was chosen so that substitution is all it takes.

`balanceAfterRials` is recorded at settlement rather than recomputed for
display, because a receipt that recalculates a balance is a receipt that
changes after the fact.

### A payment the bank has not answered credits nothing

`pending` is the only non-terminal status and it means «we do not know». The
wallet is not credited on a maybe. The receipt offers «ask again», which runs
the same settlement path as the first return — one question with one answer,
rather than the canvas's button that simply declares success.

### Every function takes a viewer

Reading, settling and cancelling a payment all resolve the id inside the
viewer's own rows. Another customer's payment id returns `undefined`, and the
pages turn that into a 404 — the same answer as an id that names nothing,
because a 403 confirms the guess.

### The development control over the ending is the provider's, and is spent early

A reviewer needs to see four result screens without four real cards. The
select on the form posts a staged outcome, which is honoured only where
`paymentsAvailable()` is true and is consumed at _authorisation_ time. The
answer to a later «what happened» is fixed before the customer returns, so the
control cannot steer a settlement — it configures the fake bank, it does not
bypass the shop.

A staged `pending` answers «not yet» once and then settles, which is what a
slow bank does, and what makes «ask again» something a reviewer can watch work.

### Native controls, again

The design draws the four quick amounts as buttons with `aria-pressed` and the
two methods as `role="radio"` buttons. Both became real radio groups in
fieldsets: picking one unpicks the others without code, and the arrow keys
work. The unavailable method is shown and disabled rather than hidden — and
refused again on the server, because a control the page disables is a control a
request can still name.

### The copy button tells the truth

The canvas copies inside `try {} catch (e) {}` and then announces success
regardless. Here a refused clipboard — a privacy mode, a browser without the
API — says so and tells the customer to write the number down. The
confirmation sits under the receipt rather than in a toast further down the
page, next to the button that was pressed.

## What measurement found

Every screen was rendered at 390×844 beside the canvas and diffed section by
section. The form matches exactly on the first render, and the receipt matches
in every block:

| section | canvas | built |
| ------- | ------ | ----- |
| header  | 57     | 57    |
| stepper | 108.8  | 108.8 |
| balance | 83.8   | 83.8  |
| amount  | 245.2  | 245.2 |
| method  | 191    | 191   |
| review  | 152    | 152   |
| footer  | 103.4  | 103.4 |

Two differences are deliberate. The status circle on the receipt keeps its 78px
— the canvas lets it shrink, which turns the one thing the screen is about into
a small circle — and the development-only control over the staged ending adds a
block the design does not have.

Two numbers needed correcting against the canvas once measured: the waiting
screen's title was set on the display face's tight leading rather than the
body's, and the form that carries the automatic return was taking a gap of its
own in the centred column.

## What this leaves open

- The provider. There is no merchant account, no callback URL and no signing
  secret. A real integration replaces `psp.ts` and nothing above it.
- `/wallet/transactions` is linked from the header and from the account's
  wallet card, and is not built. The payment rows it would list already exist.
- The store, as ADR 0007 records: payments are a map, and money in a map is
  honest only because the production guard refuses to serve it.
- Refunds. A cancelled or failed payment credits nothing, so nothing has to be
  given back yet; a payment that succeeded and must be reversed has no path.
- Card to card is drawn as unavailable rather than drawn as working.
