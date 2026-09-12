/**
 * Every URL the storefront owns, in one place.
 *
 * Before this file the site had roughly ninety hand-written `href` strings and
 * fourteen of them pointed at pages that did not exist — including
 * `/installment`, which is in the tab bar on every screen, and `/search`,
 * which is where the header's search box submits. Scattered string literals do
 * not fail a build, do not fail a test, and are only found by a customer.
 *
 * So: routes are built by functions here, `__tests__/routes.test.ts` asserts
 * that every path this module can produce has a page behind it, and nothing
 * outside this file writes an internal path by hand. A route that is renamed
 * is renamed once.
 *
 * Two rules the builders follow.
 *
 * **Segments are encoded, queries are built with `URLSearchParams`.** A slug
 * is catalogue data and a search term is whatever somebody typed; either can
 * contain a character that would otherwise end the path or start a second
 * parameter.
 *
 * **Nothing here reads state.** These are pure functions of their arguments,
 * so they are safe in a client component, in a server component and in a test.
 */

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

/** Query values that are absent, false or empty are simply not written. */
type QueryValue = string | number | boolean | undefined | null;

function withQuery(path: string, query: Readonly<Record<string, QueryValue>>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    params.set(key, value === true ? '1' : String(value));
  }

  const search = params.toString();
  return search === '' ? path : `${path}?${search}`;
}

const segment = (value: string): string => encodeURIComponent(value);

/* -------------------------------------------------------------------------- */
/* Listing filters                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The filters a listing URL can carry.
 *
 * Deliberately the same names `parseListingQuery` reads, so the round trip —
 * build a URL, follow it, parse it — is checkable rather than hopeful.
 */
export interface ListingLinkQuery {
  readonly q?: string;
  readonly sort?: string;
  readonly page?: number;
  readonly minPrice?: string;
  readonly maxPrice?: string;
  readonly minWeightMg?: string;
  readonly maxWeightMg?: string;
  readonly karat?: number;
  readonly colour?: string;
  readonly collection?: string;
  readonly discounted?: boolean;
  readonly installment?: boolean;
  readonly inStock?: boolean;
}

/* -------------------------------------------------------------------------- */
/* The routes                                                                 */
/* -------------------------------------------------------------------------- */

export const routes = {
  home: () => '/',

  /* -- catalogue ------------------------------------------------------------ */

  /** The whole shop, filtered. */
  products: (query: ListingLinkQuery = {}) => withQuery('/products', { ...query }),
  product: (slug: string) => `/products/${segment(slug)}`,
  productReviews: (slug: string) => `/products/${segment(slug)}/reviews`,
  productReviewNew: (slug: string) => `/products/${segment(slug)}/reviews/new`,
  productQuestions: (slug: string) => `/products/${segment(slug)}/questions`,
  productShipping: (slug: string) => `/products/${segment(slug)}/shipping`,

  /** The facet browser. `category` pre-selects a tab. */
  categories: (categorySlug?: string) =>
    withQuery('/categories', { category: categorySlug ?? undefined }),
  /** A listing scoped to one category or sub-type. */
  category: (slug: string, query: ListingLinkQuery = {}) =>
    withQuery(`/categories/${segment(slug)}`, { ...query }),

  search: (term?: string) => withQuery('/search', { q: term ?? undefined }),

  /* -- commerce ------------------------------------------------------------- */

  cart: () => '/cart',
  cartSaved: () => '/cart/saved',
  checkoutDelivery: () => '/checkout/delivery',
  checkoutPayment: () => '/checkout/payment',
  checkoutReview: () => '/checkout/review',
  /** The receipt shown straight after paying. */
  checkoutOrder: (code: string) => `/checkout/orders/${segment(code)}`,

  /** Instalment terms, and what can be bought on them. */
  installment: (query: { readonly category?: string; readonly product?: string } = {}) =>
    withQuery('/installment', { ...query }),

  /* -- account -------------------------------------------------------------- */

  account: () => '/account',
  accountOrders: (filter?: string) => withQuery('/account/orders', { filter: filter ?? undefined }),
  /** An order as the customer's own record of it, after the receipt. */
  accountOrder: (code: string) => `/account/orders/${segment(code)}`,
  accountProfile: () => '/account/profile',
  accountSecurity: () => '/account/security',
  accountAddresses: () => '/account/addresses',
  accountAddress: (id: string) => `/account/addresses/${segment(id)}`,
  accountAddressNew: () => '/account/addresses/new',
  accountIdentity: () => '/account/identity',
  accountIdentityDetails: () => '/account/identity/details',
  accountIdentityBank: () => '/account/identity/bank',
  accountIdentitySelfie: () => '/account/identity/selfie',

  walletTopUp: () => '/wallet/top-up',
  walletTopUpIntent: (id: string) => `/wallet/top-up/${segment(id)}`,
  walletTopUpResult: (id: string) => `/wallet/top-up/${segment(id)}/result`,
  walletTransactions: () => '/wallet/transactions',

  /* -- sign in -------------------------------------------------------------- */

  login: (intent?: 'password') => withQuery('/login', { intent: intent ?? undefined }),
  loginVerify: () => '/login/verify',
  loginPassword: () => '/login/password',
  loginPasswordNew: () => '/login/password/new',

  /* -- editorial and policy ------------------------------------------------- */

  goldPrice: () => '/gold-price',
  blog: () => '/blog',
  article: (slug: string) => `/blog/${segment(slug)}`,
  /** Buying guides, delivery, returns, payment, contact — one content family. */
  help: (topic: string) => `/help/${segment(topic)}`,
  about: (topic?: string) => (topic === undefined ? '/about' : `/about/${segment(topic)}`),
  privacy: () => '/privacy',
  terms: () => '/terms',
  /**
   * Support.
   *
   * Its own route rather than `help('contact')`. Three pages already linked to
   * `/contact` and the footer linked to `/help/contact`, which is two
   * addresses for one page — and two pages to keep in step.
   */
  contact: () => '/contact',
} as const;

export type RouteName = keyof typeof routes;
