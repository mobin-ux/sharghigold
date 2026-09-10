/**
 * The storefront's way in to a single product.
 *
 * Same seam as `navigation.ts`: pages and components know `getProduct()` and
 * the contract types it returns, and nothing else. Today the source is a
 * literal in `products.ts`; when `GET /api/v1/products/:slug` exists, only the
 * body of `loadProduct` changes into a `fetch` parsed by the same schema.
 *
 * The parse is not ceremony. A fixture that has drifted from the contract and
 * a server that has drifted from the contract are the same bug, and catching
 * it here is the difference between a failed request and a product page
 * quietly missing its weight.
 *
 * Server-only. Nothing in here should reach a client bundle.
 */
import { productDetailSchema, type ProductDetail } from '@sharghigold/contracts';
import { gramsToMilligrams } from '@sharghigold/money';

import {
  PROFIT_BASIS_POINTS,
  PRODUCT_FIXTURES,
  RING_BREADCRUMB,
  RING_SIZE_GUIDE,
  ringSizes,
  VAT_BASIS_POINTS,
  type ProductFixture,
} from './products';
import { getRatingSummary } from './reviews';

/** Thrown when a product cannot be produced in a shape the storefront can render. */
export class ProductContractError extends Error {
  constructor(slug: string, detail: string) {
    super(`Product "${slug}" did not match the contract: ${detail}`);
    this.name = 'ProductContractError';
  }
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function toDetail(fixture: ProductFixture): ProductDetail {
  const candidate = {
    slug: fixture.slug,
    sku: fixture.sku,
    title: fixture.title,
    latinTitle: fixture.latinTitle,
    breadcrumb: [...RING_BREADCRUMB, { label: fixture.leafCrumb, categorySlug: null }],
    media: fixture.media,
    karat: fixture.karat,
    weightMilligrams: gramsToMilligrams(fixture.grams).toString(),
    weightToleranceMilligrams: gramsToMilligrams(fixture.toleranceGrams).toString(),
    makingFeeBasisPoints: fixture.makingFeeBasisPoints,
    profitBasisPoints: PROFIT_BASIS_POINTS,
    vatBasisPoints: VAT_BASIS_POINTS,
    colours: fixture.colours,
    sizes: ringSizes(fixture.unavailableSizes),
    sizeGuide: RING_SIZE_GUIDE,
    specs: fixture.specs,
    description: fixture.description,
    rating: getRatingSummary(fixture.slug),
    unitsSold: fixture.unitsSold,
    inStock: fixture.inStock,
    installmentEligible: fixture.installmentEligible,
    relatedSlugs: fixture.relatedSlugs,
  };

  const parsed = productDetailSchema.safeParse(candidate);

  if (!parsed.success) {
    // The issue list names the offending path, which is what makes a bad
    // fixture or a drifted API findable. Server-side detail; the route renders
    // its own error state and never shows this.
    throw new ProductContractError(
      fixture.slug,
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }

  return parsed.data;
}

let cached: Map<string, ProductDetail> | undefined;

function catalogue(): Map<string, ProductDetail> {
  // Memoised for the life of the process: this is catalogue data, not
  // per-request data. The HTTP implementation replaces this with the fetch
  // cache, which is why the accessors below are async.
  cached ??= new Map(PRODUCT_FIXTURES.map((fixture) => [fixture.slug, toDetail(fixture)]));
  return cached;
}

/**
 * One product, or undefined when there is no such product.
 *
 * `slug` comes from the URL, so it is arbitrary text. It is only ever used as
 * a map key — never to build a path, a query or a filename — so an unknown or
 * hostile value can do nothing but miss.
 *
 * Undefined rather than a throw: a product that has been withdrawn is a 404,
 * which is an ordinary answer, and the route says so. Throwing would make it
 * indistinguishable from the catalogue being broken.
 */
export async function getProduct(slug: string): Promise<ProductDetail | undefined> {
  return catalogue().get(slug);
}

/**
 * The products shown in the «مشابه این محصول» rail.
 *
 * Resolved from slugs rather than embedded in the product, so a related piece
 * that is withdrawn disappears from the rail instead of leaving a card that
 * leads to a 404. Silently skipping a missing slug is right here: a slightly
 * shorter rail is not worth failing a page over.
 */
export async function getRelatedProducts(
  product: ProductDetail,
): Promise<readonly ProductDetail[]> {
  const all = catalogue();

  return product.relatedSlugs
    .map((slug) => all.get(slug))
    .filter((related): related is ProductDetail => related !== undefined);
}

/** Every product slug, for `generateStaticParams` and for tests. */
export async function listProductSlugs(): Promise<readonly string[]> {
  return [...catalogue().keys()];
}
