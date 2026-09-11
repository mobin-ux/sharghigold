# ADR 0007 — The account, and a sign-in that is not a drawing of one

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

`Zarnama Account` is one `.dc.html` file holding fourteen screens: four steps
of signing in, the account home, the profile, verification and its three
steps, orders, addresses, the address form, and security. They are switched by
a `screen` field in component state, and everything they know lives in the
browser:

```js
const KYC_STATES = { none: {...}, pending: {...}, verified: {...}, rejected: {...} };
const SESSIONS = [{ name: 'iPhone 14 — سافاری', meta: 'تهران · هم‌اکنون فعال', current: true }, ...];
```

The code that verifies a phone number is `s.code.length === 5`. The selfie
challenge is the constant «۴۸۲۹۱». The phone step offers «sign in with a
password» only when the number already has one.

That is the right amount of machinery for a drawing. It is the wrong amount
for the page that decides who a customer is.

## Decisions

### A real session layer, over a store that refuses to run in production

`server/account/` holds session issue and revocation, one-time codes, rate
limits, password hashing, and a gateway every page reads through. What it does
not hold is a database: the tables are maps hung off `globalThis`, and
`accountsAvailable()` returns false when `NODE_ENV` is `production`, the same
way `next.config.ts` decides about `unsafe-eval`. Every entry point calls
`assertAvailable()` first.

The alternative was to draw the screens against fixtures and leave the
security for later. That would have made the security decisions unreviewable
now and rewritten the pages twice. This way the decisions are written down and
exercised, the pages are measurable against the canvas, and a deployment
cannot hand out sessions from a map — it refuses in one place, loudly, rather
than working badly.

### Sessions are opaque tokens; only a keyed hash is stored

`startSession` mints 256 bits from `randomBytes`, stores
`HMAC-SHA256(SESSION_SECRET, token)`, and puts the token in an HttpOnly,
Secure, SameSite=Lax cookie scoped to the site. Lookups hash the presented
token and compare in constant time. Expiry and revocation are checked on the
server on every read rather than left to the cookie's own `maxAge`, which is a
request the browser may ignore.

The secret is read lazily. In development an absent one becomes a random value
per process — so sessions do not survive a restart, which is correct — and in
production its absence throws `SecretMissingError` rather than falling back to
anything.

### One-time codes are keyed, short-lived, attempt-counted, and single-use

Five digits from `randomInt`, hashed under the same key, 120 seconds, five
attempts, deleted rather than marked on use. Requests are limited in fixed
windows: one resend a minute, three codes in ten minutes, ten verifications in
ten minutes, eight password attempts in fifteen. The code itself never appears
in a response; in development it is written to the server log, which is the
only place it is ever readable in the clear.

### The sign-in flow does not answer whether a number has an account

The canvas shows the password affordance only when `hasPassword` is true,
which turns the phone step into an oracle: type a number, learn whether it
belongs to a customer. Here the phone step never offers it, the code step
always does, and the response to a code request is identical either way —
same wording, same redirect, same timer — because the account is created when
the code is issued.

The password path is the same shape. A number with no account, a number with
no password, and a wrong password all produce one sentence, and all three do
the same scrypt work: a `DUMMY_HASH` is compared against when there is nothing
to compare to, so the failing path costs what the succeeding one costs.

### Ten screens became fifteen routes

The canvas's `screen` field became the router. Back, refresh, the browser's
history and a shared link then behave without the page implementing any of
them, and the guards on the verification steps are redirects a request cannot
skip rather than a conditional in a render.

### Every read and write is scoped to the viewer

Each gateway function takes a `Viewer` and resolves ids inside that viewer's
own rows. An address id belonging to somebody else returns `undefined` or
`not-found` — the same answer as an id that names nothing, because a 403 tells
the caller their guess was right.

### The selfie challenge is issued per attempt

The canvas hardcodes «۴۸۲۹۱». A fixed number means one photograph is valid
forever and for everybody. `issueSelfieChallenge` mints a new five digits when
the step is opened, the submission must carry the one on file, and it is
cleared on use.

### Native controls in place of drawn ones

The design draws `<button role="switch">` for the two toggles, `<button
role="radio">` for the address labels, and deletes an address the moment the
trash icon is pressed. Those became a checkbox, a radio group in a fieldset,
and a `<dialog>` confirmation that degrades to a direct submit when scripting
is off. The space bar, the checked state, the form payload and the arrow keys
then come from the platform, which cannot get them wrong.

### The status colours failed AA, and now have text aliases

Measured against the grounds the design puts them on, the three functional
colours fail as text: success 2.68:1, danger 2.60:1, warning 2.53:1 — worse
than the gold-on-ivory failure `--color-price` already exists for. The canvas
had noticed too, and patched around it in its own `<style>` block:

```css
:root {
  --green-700: #186b41;
  --red-700: #a83636;
  --amber-700: #7f5817;
}
```

Those three values are now `--color-success-text`, `--color-danger-text` and
`--color-warning-text` in both themes, with tests that assert both the failure
of the originals and the fix.

## What measurement found

Every screen was rendered at 390×844 beside the canvas and diffed section by
section. The account home now matches to the tenth of a pixel — 1646.3 against
1646.3 — and so do the verification overview, orders, addresses, security, the
three verification steps and the four sign-in steps.

Three defects came out of doing it rather than out of reading the code:

- **`hashPassword` threw on every call.** scrypt at N=2¹⁵, r=8 needs exactly
  32 MiB, which is node's default `maxmem`, and the check is strict. Setting a
  password failed with `memory limit exceeded`. `maxmem` is now stated, and
  `passwordMatches` refuses parameters larger than the ones this code issues
  rather than allocating whatever a stored row asks for.
- **A seeded postal code did not satisfy the postal-code rule**, so the
  addresses page returned 500 for the demo customer. The canvas's placeholder
  «۱۹۹۷۸۴۵۶۱۲» is not a valid Iranian postal code; the last five digits may
  not contain a 2.
- **An unrecognised `filter` in the query string threw** instead of falling
  back, which the comment beside it claimed it did. `orderQuerySchema` now
  uses `catch`, so a mistyped link shows the list.

## What this leaves open

- The store. Nothing here persists, and the production guard is what makes
  that honest rather than hidden. Addresses, orders, sessions and the wallet
  belong in the database with the constraints and transactions ADR 0001
  describes.
- Delivery. There is no SMS provider; the code goes to the server log.
- The selfie upload, the map picker, and changing a mobile number are drawn as
  unavailable rather than drawn as working. Each needs a place to put a file
  or a second verified number, and neither exists yet.
- Rate-limit state is per-process, which is a lie the moment there are two.
- Instalments, favourites, messages and the wallet's own pages are linked from
  the menu and not built.
