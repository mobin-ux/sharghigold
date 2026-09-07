# Webfonts — not yet in the repository

`tokens/fonts.css` declares eleven `@font-face` rules pointing at this
directory. The binaries are **missing**, so the stack currently falls back to
Segoe UI / Tahoma. Those render Persian, but they change the numeral shapes the
design depends on, and the display face is wrong everywhere.

Required files:

| Family        | Weights                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| PeydaWebFaNum | Regular 400, Medium 500, SemiBold 600, Bold 700, Black 900                |
| AriaWeb       | Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800, Heavy 900 |

Filenames must match `fonts.css` exactly, e.g. `PeydaWebFaNum-Regular.woff2`.

## Why they are not committed yet

1. They live in the Claude Design project as binaries, and that channel is not
   a sensible transport for them.
2. **Licensing is unconfirmed.** Peyda and AriaWeb are commercial Persian
   typefaces. Self-hosting them on a public production site requires a webfont
   licence. That needs answering before launch — it is a legal question, not a
   technical one.

## Where they are actually served from

`tokens/fonts.css` references them at the absolute path `/fonts/<name>.woff2`,
not relative to this directory. Absolute paths are deliberate: a bundler does
not try to resolve them at build time, so a missing font degrades to the
fallback stack at runtime rather than failing the build.

So the files belong in the consuming app public root:

```
apps/storefront/public/fonts/
```

This directory holds the canonical copies once licensing is settled; copy them
into the app public directory from here.
