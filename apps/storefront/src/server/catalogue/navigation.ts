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

import type { CategorySource } from '@/server/ports';

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
  return navigationSync();
}

/**
 * The same data, without the promise.
 *
 * Memoised for the life of the process: this is merchandising data, not
 * per-request data, and re-parsing it on every render would be waste. The HTTP
 * implementation will replace this with the fetch cache, at which point the
 * async accessor above is the only one that can exist — which is why nothing
 * outside this module calls this one except the fixture catalogue, whose
 * breadcrumbs the API will build for itself.
 */
function navigationSync(): CategoryNavigation {
  cached ??= loadNavigation();
  return cached;
}

/**
 * What a category calls itself, for a breadcrumb.
 *
 * Undefined for a slug the catalogue does not contain, so a product filed
 * under a category that has been removed fails its contract parse loudly
 * rather than rendering a trail with a hole in it.
 */
export function categoryTitle(slug: string): string | undefined {
  return navigationSync().categories.find((category) => category.slug === slug)?.title;
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

/* -------------------------------------------------------------------------- */
/* Resolving a slug from the URL                                              */
/* -------------------------------------------------------------------------- */

/**
 * What a `/categories/:slug` URL turned out to mean.
 *
 * `category` is always a top-level category — the one whose products the
 * listing will show. `title` is what the page calls itself, which is the
 * category's own name for a top-level slug and the facet tile's label for a
 * sub-type such as `earrings-drop`.
 *
 * The distinction matters because sub-types are not categories. They are tiles
 * a merchandiser adds to a group, and they exist only as a label and a set of
 * filters. Treating them as categories would mean every new tile needed a
 * category record behind it before it could be linked to.
 */
export interface ResolvedCategory {
  readonly category: CategoryNavigationEntry;
  readonly title: string;
  /** The slug as it appeared in the URL, which may be the sub-type's. */
  readonly slug: string;
  /** True when the URL named a sub-type rather than the category itself. */
  readonly isSubType: boolean;
}

/**
 * Resolve a slug from the URL to the category whose products it lists.
 *
 * Returns undefined for a slug the catalogue does not contain, so the route
 * can answer 404 rather than quietly showing a different category's stock —
 * which is what `selectCategory` does, deliberately, for the *browser*, where
 * falling back to the first category is better than an error. A listing is a
 * different promise: a customer who lands on `/categories/watches` and is
 * shown earrings has been told something untrue.
 *
 * `requested` is arbitrary text from the URL bar. It is only ever compared
 * against slugs the catalogue already contains, never used to build a path or
 * a query, so an unknown or hostile value can do nothing but miss.
 */
export function resolveCategory(
  navigation: CategoryNavigation,
  requested: string,
): ResolvedCategory | undefined {
  const exact = navigation.categories.find((category) => category.slug === requested);

  if (exact !== undefined) {
    return { category: exact, title: exact.title, slug: exact.slug, isSubType: false };
  }

  for (const category of navigation.categories) {
    for (const group of category.groups) {
      const tile = group.tiles.find((candidate) => candidate.slug === requested);

      if (tile !== undefined) {
        return { category, title: tile.label, slug: requested, isSubType: true };
      }
    }
  }

  return undefined;
}

/**
 * Every slug a `/categories/:slug` URL may legitimately use.
 *
 * Both the categories and every sub-type tile, so `generateStaticParams` and
 * the link-integrity test agree with what `resolveCategory` will accept.
 */
export function listCategorySlugs(navigation: CategoryNavigation): readonly string[] {
  const slugs = new Set<string>();

  for (const category of navigation.categories) {
    slugs.add(category.slug);
    for (const group of category.groups) {
      for (const tile of group.tiles) slugs.add(tile.slug);
    }
  }

  return [...slugs];
}

/**
 * What a sub-type tile calls itself, for the last crumb of a breadcrumb.
 *
 * The first tile bearing the slug wins. A sub-type can legitimately appear in
 * more than one group — «سرویس عروس» is both a model and part of the bridal
 * collection — and both carry the same label, so there is nothing to choose
 * between.
 */
export function subTypeLabel(slug: string): string | undefined {
  for (const category of navigationSync().categories) {
    for (const group of category.groups) {
      const tile = group.tiles.find((candidate) => candidate.slug === slug);
      if (tile !== undefined) return tile.label;
    }
  }

  return undefined;
}

/** Conformance with the port, checked by the compiler. See `server/ports.ts`. */
export const CATEGORY_PORT = { getCategoryNavigation } satisfies CategorySource;
