# Webfonts

The eleven `.woff2` binaries `tokens/fonts.css` declares are now here.

| Family        | Weights                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| PeydaWebFaNum | Regular 400, Medium 500, SemiBold 600, Bold 700, Black 900                |
| AriaWeb       | Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800, Heavy 900 |

Filenames match `tokens/fonts.css` exactly, e.g. `PeydaWebFaNum-Regular.woff2`.

## ⚠️ Licensing is still unconfirmed

Peyda and AriaWeb are **commercial Persian typefaces**. Self-hosting them on a
public production site requires a webfont licence, and that licence has not been
confirmed.

These files are committed because the design cannot be implemented or reviewed
without them — against the Segoe UI / Tahoma fallback the hero headline takes
four lines instead of two and every price renders in the wrong numeral shapes.
Being able to build against them is not the same as being cleared to serve them.

**Before launch:** confirm the webfont licence, or replace the faces with ones
licensed for web use. `tokens/fonts.css` is the single place the families are
declared, so a substitution is one file.

## Where they are served from

`tokens/fonts.css` references them at the absolute path `/fonts/<name>.woff2`,
not relative to this directory. Absolute paths are deliberate: a bundler does
not try to resolve them at build time, so a missing font degrades to the
fallback stack at runtime rather than failing the build.

So the serving copies live in the consuming app's public root:

```
apps/storefront/public/fonts/
```

This directory holds the canonical copies. Copy from here into any new app's
public directory.
