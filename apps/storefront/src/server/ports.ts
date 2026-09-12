/**
 * The seams the backend will arrive through.
 *
 * Every ADR in this repository makes the same promise — that a module under
 * `server/` is a gateway, and when the API is real only the body of that
 * gateway changes. This file is that promise written as types, so the compiler
 * keeps it rather than the comments.
 *
 * What it is *not* is a dependency-injection container. There is one
 * implementation of each of these and there will be two: the fixtures that
 * exist now, and an HTTP client. A registry that chooses between one thing is
 * indirection with nothing on the other side of it, and the codebase already
 * has the seam it needs — a module boundary. What was missing was a written
 * statement of the shape, which is what makes it possible to build the second
 * implementation without reading every call site to infer it.
 *
 * Each gateway asserts its own conformance with `satisfies` at the bottom of
 * its file, so a signature that drifts from the port is a build failure rather
 * than a surprise on the day the adapter is swapped.
 *
 * Three rules every implementation must hold to, because callers depend on
 * them and none of them is visible in a type:
 *
 *   **Parse at the boundary.** A fixture that has drifted from the contract
 *   and a server that has drifted from the contract are the same bug. Both are
 *   caught by parsing the response through the shared schema, in the gateway,
 *   before anything above it sees the data.
 *
 *   **Absent is `undefined`, broken is a throw.** A product that has been
 *   withdrawn is an ordinary 404 and the route says so. A catalogue that
 *   cannot be produced at all is an exception, because the two need different
 *   pages and collapsing them makes an outage look like a missing ring.
 *
 *   **Money never crosses as a number.** Amounts are whole rials as `bigint`
 *   inside the server and as digit strings on the wire. `JSON.parse` turns a
 *   number into a double, and a double cannot hold a rial total exactly.
 */
import type {
  CategoryNavigation,
  ListingQuery,
  ProductDetail,
  ProductListing,
  ProductSummary,
} from '@sharghigold/contracts';

import type { GoldRate } from '@/lib/gold-price';

/* -------------------------------------------------------------------------- */
/* The catalogue                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Reading the catalogue.
 *
 * Implemented today by `server/catalogue/product.ts`, `listing.ts` and
 * `navigation.ts` over the fixtures in `products.ts` and `taxonomy.ts`. It
 * becomes `GET /api/v1/products`, `GET /api/v1/products/:slug` and
 * `GET /api/v1/categories`.
 *
 * Every method is async even where the fixture implementation has nothing to
 * await, so that adding the network call later is not a change that ripples
 * through three routes and their tests.
 */
export interface CatalogueSource {
  /** One product, or undefined when there is no such product. */
  getProduct(slug: string): Promise<ProductDetail | undefined>;

  /**
   * Several at once, keyed by slug.
   *
   * The basket needs every product it holds in one go. Asking one at a time is
   * the shape that becomes a query per line the moment the source is a
   * database — and N requests the moment it is an API.
   */
  getProducts(slugs: readonly string[]): Promise<ReadonlyMap<string, ProductDetail>>;

  /** The «مشابه این محصول» rail. A slug with no product is skipped, not failed. */
  getRelatedProducts(product: ProductDetail): Promise<readonly ProductDetail[]>;

  /** Every slug, for `generateStaticParams` and for the link-integrity test. */
  listProductSlugs(): Promise<readonly string[]>;
}

/**
 * Searching and filtering the catalogue.
 *
 * Separate from reading one product because it is a different endpoint with
 * different caching: a listing is a query, a product is a resource. A `category`
 * the taxonomy does not contain must match nothing rather than everything.
 */
export interface ProductListingSource {
  listProducts(query: Partial<ListingQuery>): Promise<ProductListing>;

  /** A fixed set of slugs, priced, in the order given. For curated rails. */
  cardsForSlugs(slugs: readonly string[]): Promise<readonly ProductSummary[]>;
}

/** The browsable tree: categories and the facet tiles that lead into a listing. */
export interface CategorySource {
  getCategoryNavigation(): Promise<CategoryNavigation>;
}

/* -------------------------------------------------------------------------- */
/* The gold rate                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where the price of gold comes from.
 *
 * The one port with a hard requirement beyond its signature: the rate an order
 * is written against must come from here and never from a request. A rate that
 * arrived in a request body is a number a customer chose.
 *
 * `isLive` is part of the contract, not a debugging flag. Anything that
 * displays a price is expected to look at it, because showing a stale rate as
 * if it were current is how a shop honours yesterday's price on today's metal.
 */
export interface GoldRateSource {
  getGoldRate(): GoldRate;
}

/* -------------------------------------------------------------------------- */
/* Editorial content                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Pages that are text, and the magazine.
 *
 * Structured blocks, never markup. A content source that returns HTML is a
 * content source that can put a `<script>` on every reader's page, and the
 * admin panel that will own these rows is edited by people who should not have
 * to be trusted with that.
 */
export interface ContentSource<TPage, TArticle> {
  findPage(family: readonly TPage[], slug: string): TPage | undefined;
  listArticles(): readonly TArticle[];
  findArticle(slug: string): TArticle | undefined;
}
