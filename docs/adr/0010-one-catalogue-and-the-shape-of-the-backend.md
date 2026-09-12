# ADR 0010 — One catalogue, every link live, and the shape the backend arrives in

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

Nine screens had been built from the design canvases, each measured against its
drawing and each verified on its own. Reviewing them together asked a different
question — not «is this screen right» but «is this a shop» — and the answer was
no, for reasons none of the per-screen reviews could have found.

Three of them, in the order they hurt.

**There were two catalogues.** `data/demo-catalogue.ts` fed the homepage and
`server/catalogue/products.ts` fed the product page. They shared exactly one
slug. Sixteen of the seventeen product cards on the homepage linked to a page
that did not exist, and every one of them was two taps from the front door.

**Fourteen links pointed at pages that had never been built.** `/installment`
is in the tab bar on every screen. `/search` is where the header's search box
submits. `/categories/:slug` is where seventeen facet tiles lead.
`/account/orders/:code` is behind «جزئیات سفارش» on every order card. Eleven
more were in the footer. All of them rendered the framework's own 404 — English,
left-to-right, no header, no way back into the shop.

**The same commercial term was published two ways.** Instalments were «تا ۳۶
ماه، بدون پیش‌پرداخت» on the homepage, the product page, an answered customer
question and three facet tiles, while checkout takes forty percent over six to
eighteen months. VAT was 900 basis points in the product fixtures and 1,000 in
the homepage seed, so the same ring was taxed at two rates depending on which
page a customer was looking at.

None of this failed a build, a test, or a lint. All of it was reachable.

## Decisions

### One catalogue, and a listing over it

The two seeds are one. Every piece files itself under a taxonomy category and a
sub-type, and carries what a _listing_ needs and a single product page does
not: when it was listed, what collections it is in, and the promotional making
fee that makes it an offer. The breadcrumb is derived from the category rather
than written beside the product — the fixtures carried one hard-coded ring
trail, which was correct while the catalogue was five rings and silently wrong
the moment it was not.

`listProducts` is one query behind three routes. `/products`,
`/categories/:slug` and `/search` differ in what they pre-set and what they
call themselves and in nothing else, because a search that filtered differently
from a category listing would be two implementations of «which products match»
and the second one is where the out-of-stock piece reappears.

Every filter arrives as query-string text, so the parser is closed: an
unrecognised sort falls back, a malformed price narrows nothing, `?page=
99999999` is page one, and `?discounted=false` is not a discount filter —
which `z.coerce.boolean()` would have made it, since every non-empty string is
truthy.

A `category` the taxonomy does not contain matches **nothing**. The other
direction — an unknown filter widening the result — is how a typo in a facet
tile quietly lists the whole shop.

### Every internal URL is built by a function

`lib/routes.ts` is the only file that writes an internal path. Ninety hand-
written `href` strings were the reason fourteen of them pointed nowhere: a
literal does not fail a build, does not fail a test, and is only found by a
customer.

`lib/__tests__/routes.test.ts` walks the app directory, turns every `page.tsx`
into a matcher, and asserts that every URL `routes` can produce is served — and
separately that no file outside `routes.ts` contains a hand-written internal
`href`, and that every literal form `action` posts somewhere real. The second
assertion is the one that keeps the first honest.

### The pages that were missing are pages, not stubs

The listing, the search, the instalment terms and their calculator, the order
detail, the wallet ledger, the buying guides, the shop's story, the privacy
notice, the terms of sale, the magazine and the gold-rate explainer.

Three of them needed more than a route.

**The wallet ledger needed data.** The balance was a single number on the
customer record, so a customer whose balance had dropped had no way to find out
what had taken it and neither did support. Every debit and credit now writes an
entry in the same pass as the balance change, carrying the balance it left
behind — a running total recomputed at read time gives a different answer
whenever a row is inserted out of order, and the figure a customer was shown
when they looked is the one they will quote back.

**The instalment calculator had to price on the server.** It is a
`method="get"` form: the amount and the term go in the URL, the arithmetic
happens where `@sharghigold/money` is, and the quote can be shared and returned
to. A calculator that multiplies in the browser is a calculator doing float
arithmetic on a price.

**The order detail had to answer 404, not 403.** An order belonging to somebody
else is «not found», because the difference between the two answers is a
confirmation that the order code is real. `findOrder` reads only rows belonging
to the viewer, so the page cannot answer anything else even by accident.

The privacy notice and the terms of sale are a plain, truthful description of
what this build actually does. They claim no certification the shop has not
been granted and describe no processing that does not happen — and each says,
on the page, that it must be reviewed by somebody qualified before the shop
takes real money.

### One home for a commercial term

`config/commerce-terms.ts` holds the price-lock window, the margin and tax
rates, and the single instalment agreement. `shop-policy.ts` re-exports them,
so nothing calling itself «the shop's policy» has to know which of the two
files a term lives in.

The split is not tidiness: the sentences in `shop-policy.ts` are long Persian
copy that belongs on the server, while these four values are needed by client
components too, and pulling the whole policy module into a browser bundle to
read one integer is how a bundle gets large.

When the admin panel exists, this is the table it edits.

### The chrome is styled from the layout, not from a page

`.zn-head`, `.zn-foot` and the section furniture lived in `home.css`. That was
correct while the homepage was the only page mounting them, and stopped being
correct the moment five more pages used the same `<SiteHeader>` — at which
point those pages rendered it with no styles at all, its absolutely-placed
actions stacked vertically and its search box escaped the frame.

They are in `chrome.css` now, loaded from the root layout, which is the rule
`shell.css` already stated and the reason that file exists.

### The layout is fluid between 320 and 430, and honest above it

390 is the width the design was drawn at. It is not the width of a phone: an
iPhone 15 is 393, a Pro Max 430, a Pixel 8 is 412. Capping there left a band of
page background down each edge of every large phone.

One `--shell-max` token now drives the shell, the fixed tab bar and the four
docked bars that have to line up with it. Below the cap the shell fills the
viewport; at 768 it widens to 720 and the product grid goes to three across.

Above that it stays a centred column, and the stylesheet says why rather than
pretending otherwise: a desktop layout is a horizontal navigation instead of a
tab bar, a sidebar of filters instead of a row of chips, and a two-column
product page. Stretching a 390px header across 1600px would look worse than the
frame does.

`100dvh` replaces `100vh`, because on a phone `100vh` is the viewport with the
address bar hidden — so a full-height shell is taller than the screen until the
bar retracts, which is what makes a page start out scrollable by exactly the
height of that bar.

### The ports are written down

Every ADR in this repository promises that a module under `server/` is a
gateway and that only its body changes when the API is real. `server/ports.ts`
is that promise as types, and each gateway asserts its own conformance with
`satisfies`, so a signature that drifts from the shape the HTTP adapter must
implement is a build failure rather than a surprise on the day the two are
swapped.

It is deliberately **not** a dependency-injection container. There is one
implementation of each port and there will be two; a registry that chooses
between one thing is indirection with nothing on the other side of it. The
seam the codebase needed already existed — a module boundary. What was missing
was a written statement of its shape.

### The admin panel's rules are decided before the panel

`packages/contracts/src/admin.ts` exists with no panel to serve, because two of
its decisions are expensive to reverse once one is built on top of them.

**Permissions are a closed set in code, not rows an administrator can invent.**
The database has a `permissions` table and it is seeded from this list. A
permission that can be created at runtime is a permission no code checks for,
and «grant yourself a new permission» is the shortest path from a compromised
admin account to a compromised shop. Roles are data; what a role may contain is
not.

**Read and write are separate, and three actions are their own permission**
because each is a way to take money or to hide having taken it: `order.refund`,
`discount.write`, `settings.write`. A fourth, `audit.read`, is separate because
reading the log of what everyone did is not something every role should have.

A refund names an order and a reason, never an amount — an amount in a request
body is an amount an attacker or a mistyped form chooses — and requires an
idempotency key, because a refund is the one action where a double submission
moves money twice. A stock change is a delta with a reason, never an absolute:
«set stock to 4» loses the race against somebody buying the fifth one. A product
draft carries no price at all, because a price is derived from weight, purity,
fee rates and the live rate, and a panel that could type one would be a second
source for it.

The API's authorisation decision is written and tested now, against a directory
interface with no implementation. The decision is the part that is expensive to
get wrong; how an administrator signs in is separate work with its own
decisions, and inventing an answer here would be inventing the wrong one. The
guard **fails closed**: a handler under it that declares no permission is
refused, because forgetting the decorator is the likeliest mistake anybody will
make and the safe reading of a mistake is «no».

## What measurement found

Every route was probed at 320 pixels for content wider than the viewport.

| route               | before | after |
| ------------------- | ------ | ----- |
| `/` homepage        | 327    | 320   |
| `/products`         | —      | 320   |
| `/categories/:slug` | —      | 320   |
| `/installment`      | —      | 320   |
| `/gold-price`       | —      | 320   |
| `/blog/:slug`       | —      | 320   |
| `/cart`             | 320    | 320   |
| `/account`          | 320    | 320   |

The homepage's seven pixels were the weight bands: a 135px column and
«۱۳۱٬۳۷۲٬۰۴۰» at fifteen point, which is not a string that can be made
narrower. The row wraps now.

The header's own failure was found the same way, by measuring rather than
looking: `.zn-head__row` computed to `display: block` on `/products`, which is
what a flex container computes to when its stylesheet was never loaded.

## What this leaves open

- **The admin panel itself**, and the directory behind its guard. The
  authorisation decision is built and tested; sign-in, the second factor, and
  session revocation are not.
- **The API serves nothing yet.** The contracts, the error envelope, the
  request id and the guard are in place; no controller reads the catalogue,
  because the storefront's fixtures are still the source and two sources is the
  bug this ADR is mostly about.
- **Changing a verified mobile number.** It is the credential the account signs
  in with, so it needs an OTP-verified flow of its own. The profile page links
  to support rather than to a page that was never built.
- **Product photography.** Every gallery and card is still a placeholder, and
  `next/image` drops into the slot that is already there.
- **The gold rate is a constant.** `GoldRateSource` is the port it arrives
  through, and `isLive` is false until it does — which the rate page states on
  the page rather than hiding.
- **Refunds, part-payment and instalment underwriting**, as ADR 0009 recorded.
  The admin contracts now describe what a refund request looks like; nothing
  performs one.
