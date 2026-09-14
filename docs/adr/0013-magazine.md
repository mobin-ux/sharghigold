# ADR 0013 — The magazine

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

`/blog` and `/blog/:slug` were plain text pages over four articles, sharing the
policy pages' stylesheet. The `Zarnama Blog` canvas draws a whole magazine as
one screen that switches between five views in component state:

- a home with a masthead, topic chips, a lead story, a gold-rate strip, the
  latest articles, a newsletter card, suggested searches and an advice card;
- a topic archive with sorting and pages;
- a search with suggestions, most-read articles and results;
- an author profile;
- an article with a byline, a table of contents, a summary, body, a product
  panel, an instalment panel, questions, sources, an author box and related
  articles.

## Decisions

### Five views, five addresses

| View    | Route                                             |
| ------- | ------------------------------------------------- |
| Home    | `/blog`                                           |
| Archive | `/blog/topics`, `/blog/topics/:topic?sort=&page=` |
| Search  | `/blog/search?q=`                                 |
| Author  | `/blog/authors/:author`                           |
| Article | `/blog/:slug`                                     |

A view kept in state cannot be shared, reloaded, crawled or reached with the
back button. Every chip, sort, page and card is a link built by `routes.*`.

The pages are Server Components. Only two islands run on the client:

- **Reading-progress bar:** it follows the scroll position.
- **Newsletter card:** it shows the answer to its own submission.

The search is a GET form. The canvas filters as the reader types, which would
send the whole archive to the browser.

A test fails if an article slug collides with `topics`, `search` or `authors`.

### Query strings go through the contract

`packages/contracts/src/magazine.ts` parses `sort`, `page` and `q` the same
closed way the product listing does. An unknown sort or an out-of-range page
falls back to the default, and a term longer than 80 characters is no search at
all. A page past the end of an archive shows the last page.

### Articles are typed blocks

`server/content/magazine/` holds the content:

- **`types.ts`:** the types.
- **`topics.ts`:** the topics.
- **`authors.ts`:** the authors.
- **`articles.ts`:** the articles.
- **`index.ts`:** the queries the pages make.

An article body is a list of blocks: heading, paragraph (runs, optionally
bold), list, table, quote, products, installment. It never contains HTML, so
content from the future admin panel cannot put script on a reader's page.

The table of contents is derived from the heading blocks.

Product panels name catalogue slugs. A test checks that every slug exists, and a
missing slug renders nothing.

Any figure an article states about the shop comes from `config/commerce-terms.ts`:

- the deposit;
- the monthly surcharge;
- the longest term;
- the VAT base.

### Placeholder content is labelled as such

The articles and authors are placeholders, as the old magazine's were. The
authors file says their credentials must be replaced by real people's before
launch, and `popularity` is marked as a stand-in for analytics.

Market commentary contains no figures. The canvas's bubble table with coin
prices becomes a qualitative comparison, because a made-up premium percentage
would read as a market statistic.

## Where it departs from the canvas

- **The newsletter has no «هشدار قیمت» choice.** Price alerts do not exist, so
  the card posts to the one SMS list the homepage uses (`subscribeToUpdates`).
  Its note is a consent line rather than a privacy promise nobody has made. The
  card is 68px shorter.
- **No bookmark button** on an article. There is no saved-articles list, and a
  toggle that forgets on reload misleads.
- **No sources on placeholder articles.** The canvas cites real organisations'
  reports that do not exist. The section shows only when an editor supplies
  sources; the disclaimer always shows.
- **Honest labels:**
  - The masthead badge no longer promises weekly analysis.
  - Its third stat counts authors rather than claiming a weekly cadence.
  - «موضوع‌های پرجست‌وجو» and «جست‌وجوهای پرتکرار» become suggestions, since no
    search analytics exist.
- **The rate strip shows 18-karat gold per gram with its as-of date.** The canvas
  quotes a mithqal price with a pulsing live dot and a daily change. The rate
  source is not live.
- **Instalment copy uses the real terms.** The canvas's «تا ۳۶ ماه» and its news
  item about a 36-month ceiling are gone. A test fails if either returns.
- **Consultation links go to `/contact`.** The instalment callback is about
  instalments, not buying advice.
- **The table of contents is open by default**, as the canvas markup says; the
  canvas's renderer drops the attribute.
- **Six articles per archive page**, not four.
- **The product panel uses the compact card.** «افزودن به سبد» becomes a link to
  the product, because adding to the cart needs a size and colour.

## What measurement found

Rendered at 390 × 844 beside the canvas, with fonts loaded:

| element                                  | canvas                | build                 |
| ---------------------------------------- | --------------------- | --------------------- |
| header / with progress bar               | 56.8 / 58.8           | 56.8 / 58.8           |
| masthead                                 | 265.3                 | 265.3                 |
| topic chips                              | 54                    | 54                    |
| lead story (media / body)                | 170 / 174.5           | 170 / 174.5           |
| rate strip section                       | 121.8                 | 121.8                 |
| latest section                           | 752.2                 | 752.2                 |
| suggested searches                       | 131.1                 | 131.1                 |
| advice section                           | 220.6                 | 220.6                 |
| archive trail / head / chips             | 30.4 / 149.6 / 52     | 30.4 / 149.6 / 52     |
| archive card / pager                     | 109.6 / 88            | 109.6 / 88            |
| search field / suggestions               | 62 / 348.8            | 62 / 348.8            |
| search result card                       | 149.3                 | 149.3                 |
| author specialties / writing             | 72.2 / 509.7          | 72.2 / 509.7          |
| article figure                           | 222                   | 222                   |
| article prose after products             | 389.1                 | 389.1                 |
| article questions / author box / related | 269.5 / 218.1 / 286.8 | 269.5 / 218.1 / 286.8 |

Differences come from content or the departures above:

- the newsletter card and the product panel (above);
- summary and body length;
- a bio one line shorter.

Titles the canvas sets as `<span>` got the body line height, which closed
2.5–7px gaps. No page overflows at 320px.
