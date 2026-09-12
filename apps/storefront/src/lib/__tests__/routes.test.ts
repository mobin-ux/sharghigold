import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { routes } from '../routes';

/**
 * Does every link go somewhere?
 *
 * This test exists because the answer was no. The storefront had roughly
 * ninety hand-written `href` strings and fourteen of them pointed at pages
 * that did not exist — `/installment`, which is in the tab bar on every
 * screen; `/search`, which is where the header's search box submits;
 * `/categories/:slug`, which seventeen facet tiles lead to. None of it failed
 * a build, none of it failed a test, and all of it was reachable in two taps.
 *
 * So two things are pinned here. Every URL `routes` can produce has a page
 * behind it, and no file outside `routes.ts` writes an internal path by hand —
 * because a literal is exactly what cannot be checked.
 */

const SRC = join(fileURLToPath(new URL('../..', import.meta.url)));
const APP = join(SRC, 'app');

/* -------------------------------------------------------------------------- */
/* What routes exist                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Every route the app directory defines, as a matcher.
 *
 * A `[slug]` segment becomes «one segment, anything»; a `[...rest]` becomes
 * «one or more». Route groups — `(name)` — are not path segments and are
 * dropped, which is what the framework does with them.
 */
function collectRoutes(dir: string, prefix = ''): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      const segment = entry.startsWith('(') && entry.endsWith(')') ? '' : `/${entry}`;
      found.push(...collectRoutes(full, `${prefix}${segment}`));
      continue;
    }

    if (entry === 'page.tsx' || entry === 'route.ts') {
      found.push(prefix === '' ? '/' : prefix);
    }
  }

  return found;
}

const ROUTE_PATTERNS = collectRoutes(APP);

function toMatcher(pattern: string): RegExp {
  const body = pattern
    .split('/')
    .filter((part) => part !== '')
    .map((part) => {
      if (part.startsWith('[...') || part.startsWith('[[...')) return '.+';
      if (part.startsWith('[')) return '[^/]+';
      // Everything else is a literal segment; escape it so a dot in a path
      // cannot match anything but itself.
      return part.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    })
    .join('/');

  return new RegExp(`^/${body}$`);
}

const MATCHERS = ROUTE_PATTERNS.map(toMatcher);

/** Strip the query and ask whether any route in the app serves this path. */
function isServed(href: string): boolean {
  const path = href.split('?')[0] ?? href;
  return path === '/' ? ROUTE_PATTERNS.includes('/') : MATCHERS.some((rx) => rx.test(path));
}

/* -------------------------------------------------------------------------- */
/* Every route builder leads somewhere                                        */
/* -------------------------------------------------------------------------- */

/**
 * One representative call per builder.
 *
 * Written out rather than reflected over, because the arguments carry meaning:
 * a slug with a space in it is the case that proves the builder encodes, and
 * only a human knows which argument is a slug.
 */
const SAMPLES: readonly string[] = [
  routes.home(),
  routes.products(),
  routes.products({ sort: 'newest', page: 2, discounted: true }),
  routes.product('classic-solitaire-ring'),
  routes.productReviews('classic-solitaire-ring'),
  routes.productReviewNew('classic-solitaire-ring'),
  routes.productQuestions('classic-solitaire-ring'),
  routes.productShipping('classic-solitaire-ring'),
  routes.categories(),
  routes.categories('rings'),
  routes.category('rings'),
  routes.category('rings-solitaire', { sort: 'price-asc' }),
  routes.search(),
  routes.search('گوشواره'),
  routes.cart(),
  routes.cartSaved(),
  routes.checkoutDelivery(),
  routes.checkoutPayment(),
  routes.checkoutReview(),
  routes.checkoutOrder('ZN-88520'),
  routes.installment(),
  routes.installment({ category: 'rings' }),
  routes.account(),
  routes.accountOrders(),
  routes.accountOrders('open'),
  routes.accountOrder('ZN-88520'),
  routes.accountProfile(),
  routes.accountSecurity(),
  routes.accountAddresses(),
  routes.accountAddress('01997d1a-4c8e-7a31-9f60-2b5c7d0e4201'),
  routes.accountAddressNew(),
  routes.accountIdentity(),
  routes.accountIdentityDetails(),
  routes.accountIdentityBank(),
  routes.accountIdentitySelfie(),
  routes.walletTopUp(),
  routes.walletTopUpIntent('01997d1a-4c8e-7a31-9f60-2b5c7d0e4201'),
  routes.walletTopUpResult('01997d1a-4c8e-7a31-9f60-2b5c7d0e4201'),
  routes.walletTransactions(),
  routes.login(),
  routes.login('password'),
  routes.loginVerify(),
  routes.loginPassword(),
  routes.loginPasswordNew(),
  routes.goldPrice(),
  routes.blog(),
  routes.article('gold-price-outlook'),
  routes.help('faq'),
  routes.about(),
  routes.about('careers'),
  routes.privacy(),
  routes.terms(),
  routes.contact(),
];

describe('every route builder leads to a page', () => {
  it('found the app directory', () => {
    // If this fails the rest of the file is vacuously true, which is the worst
    // way for a link test to pass.
    expect(ROUTE_PATTERNS.length).toBeGreaterThan(30);
  });

  it.each(SAMPLES)('%s is served', (href) => {
    expect(isServed(href)).toBe(true);
  });

  it('covers every builder in `routes`', () => {
    // A builder added without a sample would go unchecked, which is how the
    // next dead link gets in.
    const named = new Set(Object.keys(routes));
    expect(named.size).toBe(
      new Set(
        Object.entries(routes)
          .filter(([, build]) => typeof build === 'function')
          .map(([name]) => name),
      ).size,
    );
    expect(SAMPLES.length).toBeGreaterThanOrEqual(named.size);
  });
});

/* -------------------------------------------------------------------------- */
/* Nothing writes a path by hand                                              */
/* -------------------------------------------------------------------------- */

function sourceFiles(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      found.push(...sourceFiles(full));
      continue;
    }

    if (entry.endsWith('.tsx') || entry.endsWith('.ts')) found.push(full);
  }

  return found;
}

/**
 * `href="/…"` written as a literal, which is the thing that cannot be checked.
 *
 * In-page anchors (`#reviews`), telephone links and protocol-relative URLs are
 * not internal navigation and are left alone.
 */
const LITERAL_HREF = /href="(\/[^"]*)"/g;

describe('internal paths come from one place', () => {
  const files = sourceFiles(SRC).filter(
    (file) => relative(SRC, file) !== join('lib', 'routes.ts').replaceAll('/', sep),
  );

  it('finds no hand-written internal href outside `routes.ts`', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');

      for (const match of source.matchAll(LITERAL_HREF)) {
        const href = match[1] ?? '';
        offenders.push(`${relative(SRC, file)} → ${href}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('serves every path a redirect sends somebody to', () => {
    // Redirects are not written through the builder, because most of them
    // carry a page-local flag — `?done=saved`, `?problem=lock-expired` — that
    // `routes` has no business modelling. What matters is the same thing that
    // matters for a link: that the page on the other end exists. A redirect to
    // a route that was renamed is a dead end nobody can go back from.
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');

      for (const match of source.matchAll(/(?:permanentR|r)edirect\('(\/[^']*)'/g)) {
        const path = match[1] ?? '';
        if (!isServed(path)) offenders.push(`${relative(SRC, file)} → ${path}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('serves every path a literal `action` posts to', () => {
    // Forms navigate too. The header's search box is a `method="get"` form
    // whose action was `/search` for months before the route existed.
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');

      for (const match of source.matchAll(/action="(\/[^"]*)"/g)) {
        const path = match[1] ?? '';
        if (!isServed(path)) offenders.push(`${relative(SRC, file)} → ${path}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
