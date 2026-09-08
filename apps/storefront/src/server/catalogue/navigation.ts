/**
 * The storefront's way in to the category browser.
 *
 * Everything above this file — pages, components — knows only
 * `getCategoryNavigation()` and the contract types it returns. What is behind
 * it is an implementation detail, and today that is a literal in
 * `taxonomy.ts`. When `GET /api/v1/categories` exists, only the body of
 * `loadNavigation` changes: it becomes a `fetch` whose response is parsed by
 * the same schema, and nothing that calls it needs touching.
 *
 * The parse is the point of the seam. A fixture that has drifted from the
 * contract and a server that has drifted from the contract are the same bug,
 * and both are caught here rather than surfacing as a blank tile three
 * components away.
 *
 * Server-only. It is under `server/` and imported exclusively from Server
 * Components; nothing here should ever reach a client bundle.
 */
import { categoryNavigationSchema, type CategoryNavigation } from '@sharghigold/contracts';
import type { CategoryNavigationEntry } from '@sharghigold/contracts';

import { CATEGORY_TAXONOMY } from './taxonomy';

/**
 * Thrown when the catalogue cannot be produced in a shape the storefront can
 * render. Distinct from a network failure so the route can tell «the catalogue
 * is misconfigured» from «the catalogue is briefly unreachable».
 */
export class CatalogueContractError extends Error {
  constructor(detail: string) {
    super(`Category navigation did not match the contract: ${detail}`);
    this.name = 'CatalogueContractError';
  }
}

let cached: CategoryNavigation | undefined;

function loadNavigation(): CategoryNavigation {
  const parsed = categoryNavigationSchema.safeParse({ categories: CATEGORY_TAXONOMY });

  if (!parsed.success) {
    // The issue list names the offending path, which is what makes a bad
    // fixture or a drifted API findable. It is server-side detail and never
    // reaches the browser — the route renders its own error state.
    throw new CatalogueContractError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }

  return parsed.data;
}

/**
 * Every top-level category with its facet groups, in display order.
 *
 * Async because the real implementation will be. Keeping the signature
 * `Promise`-shaped now means adding the network call later is not a change
 * that ripples through every caller.
 */
export async function getCategoryNavigation(): Promise<CategoryNavigation> {
  // Memoised for the life of the process: this is merchandising data, not
  // per-request data, and re-parsing it on every render would be waste. The
  // HTTP implementation will replace this with the fetch cache.
  cached ??= loadNavigation();
  return cached;
}

/**
 * Pick the category a request is asking for, falling back to the first.
 *
 * `requested` comes from a query parameter, so it is arbitrary text from the
 * URL bar. It is only ever compared against slugs the catalogue already
 * contains — never used to build a path or a query — so an unknown or hostile
 * value can do nothing but select the default.
 *
 * A bad slug lands on the first category rather than a 404 on purpose: this is
 * a browsing surface, and a customer following a stale link is better served
 * by a working page than by an error.
 */
export function selectCategory(
  navigation: CategoryNavigation,
  requested: string | undefined,
): CategoryNavigationEntry {
  const [first] = navigation.categories;

  if (first === undefined) {
    throw new CatalogueContractError('the catalogue contains no categories');
  }

  if (requested === undefined) return first;

  return navigation.categories.find((category) => category.slug === requested) ?? first;
}
