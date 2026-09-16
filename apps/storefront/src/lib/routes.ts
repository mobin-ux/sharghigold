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
  readonly freeShipping?: boolean;
}

/** The confirmation or refusal a basket or checkout screen is opened with. */
export interface CommerceNotice {
  readonly ok?: string | undefined;
  readonly problem?: string | undefined;
}

/**
 * The confirmation an account screen is opened with after a form succeeds.
 * Like `CommerceNotice`, `done` is a key the page maps to a sentence.
 */
export interface AccountNotice {
  readonly done?: string | undefined;
}

/* -------------------------------------------------------------------------- */
/* The routes                                                                 */
/* -------------------------------------------------------------------------- */

export const routes = {
  home: () => '/',

  /**
   * JSON endpoints the browser calls. Listed here for the same reason pages
   * are: a hand-written fetch URL is a dead link nobody sees until it 404s.
   */
  apiCartCount: () => '/api/cart/count',
  /** `search` is a listing query string, as `listingHref` builds it. */
  apiProductCount: (categorySlug: string | null, search: string) =>
    withQuery('/api/products/count', {
      ...Object.fromEntries(new URLSearchParams(search)),
      category: categorySlug,
    }),

  /* -- catalogue ------------------------------------------------------------ */

  /** The whole shop, filtered. */
  products: (query: ListingLinkQuery = {}) => withQuery('/products', { ...query }),
  product: (slug: string) => `/products/${segment(slug)}`,
  /** The review list. The defaults — every review, most helpful first — are omitted. */
  productReviews: (
    slug: string,
    query: {
      readonly filter?: string | undefined;
      readonly sort?: string | undefined;
      readonly limit?: number | undefined;
    } = {},
  ) =>
    withQuery(`/products/${segment(slug)}/reviews`, {
      filter: query.filter === 'all' ? undefined : query.filter,
      sort: query.sort === 'helpful' ? undefined : query.sort,
      limit: query.limit,
    }),
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

  /**
   * The basket screens. `ok` and `problem` are keys the page maps to a
   * sentence; a sentence itself never travels in the address.
   */
  cart: (query: CommerceNotice = {}) => withQuery('/cart', { ...query }),
  cartSaved: (query: CommerceNotice = {}) => withQuery('/cart/saved', { ...query }),
  checkoutDelivery: (query: CommerceNotice = {}) => withQuery('/checkout/delivery', { ...query }),
  checkoutPayment: (query: CommerceNotice = {}) => withQuery('/checkout/payment', { ...query }),
  checkoutReview: (query: CommerceNotice = {}) => withQuery('/checkout/review', { ...query }),
  /** The receipt shown straight after paying. */
  checkoutOrder: (code: string) => `/checkout/orders/${segment(code)}`,

  /**
   * Instalment terms, and what can be bought on them.
   *
   * `amount` (toman, Latin digits) and `months` are the calculator's inputs, so
   * a quote is an address that can be shared and reloaded.
   */
  installment: (
    query: {
      readonly category?: string | undefined;
      readonly product?: string | undefined;
      readonly amount?: string | undefined;
      readonly months?: number | undefined;
    } = {},
  ) => withQuery('/installment', { ...query }),

  /* -- account -------------------------------------------------------------- */

  account: (query: AccountNotice = {}) => withQuery('/account', { ...query }),
  /** The order list. `filter` is a group chip, `q` the search; the defaults are omitted. */
  accountOrders: (query: { readonly filter?: string; readonly q?: string | undefined } = {}) =>
    withQuery('/account/orders', {
      filter: query.filter === 'all' ? undefined : query.filter,
      q: query.q,
    }),
  /** An order as the customer's own record of it, after the receipt. */
  accountOrder: (code: string) => `/account/orders/${segment(code)}`,
  accountOrderTracking: (code: string) => `/account/orders/${segment(code)}/tracking`,
  accountOrderInvoice: (code: string) => `/account/orders/${segment(code)}/invoice`,
  accountOrderCancel: (code: string) => `/account/orders/${segment(code)}/cancel`,
  /** The return form, or the return's status once there is one. */
  accountOrderReturn: (code: string) => `/account/orders/${segment(code)}/return`,
  accountOrderReview: (code: string) => `/account/orders/${segment(code)}/review`,
  accountOrderSupport: (code: string) => `/account/orders/${segment(code)}/support`,
  /** The confirmation a finished request lands on. Read from the order, not the URL. */
  accountOrderDone: (code: string, outcome: string) =>
    `/account/orders/${segment(code)}/done/${segment(outcome)}`,
  accountProfile: () => '/account/profile',
  accountSecurity: (query: AccountNotice = {}) => withQuery('/account/security', { ...query }),
  accountAddresses: (query: AccountNotice = {}) => withQuery('/account/addresses', { ...query }),
  accountAddress: (id: string) => `/account/addresses/${segment(id)}`,
  accountAddressNew: () => '/account/addresses/new',
  accountIdentity: (query: AccountNotice = {}) => withQuery('/account/identity', { ...query }),
  accountIdentityDetails: () => '/account/identity/details',
  accountIdentityBank: () => '/account/identity/bank',
  accountIdentitySelfie: () => '/account/identity/selfie',

  walletTopUp: () => '/wallet/top-up',
  walletTopUpIntent: (id: string) => `/wallet/top-up/${segment(id)}`,
  walletTopUpResult: (id: string) => `/wallet/top-up/${segment(id)}/result`,
  walletTransactions: () => '/wallet/transactions',

  /* -- sign in -------------------------------------------------------------- */

  login: (intent?: 'password') => withQuery('/login', { intent: intent ?? undefined }),
  loginVerify: (query: AccountNotice = {}) => withQuery('/login/verify', { ...query }),
  loginPassword: () => '/login/password',
  loginPasswordNew: (query: AccountNotice = {}) => withQuery('/login/password/new', { ...query }),

  /* -- editorial and policy ------------------------------------------------- */

  goldPrice: () => '/gold-price',
  /** The magazine home. */
  blog: () => '/blog',
  article: (slug: string) => `/blog/${segment(slug)}`,
  /**
   * A topic archive, or every article when `topic` is omitted. The defaults —
   * newest first, page one — stay out of the URL so each page has one address.
   */
  blogTopic: (topic?: string, query: { readonly sort?: string; readonly page?: number } = {}) =>
    withQuery(topic === undefined ? '/blog/topics' : `/blog/topics/${segment(topic)}`, {
      sort: query.sort === 'newest' ? undefined : query.sort,
      page: query.page === 1 ? undefined : query.page,
    }),
  blogSearch: (term?: string) => withQuery('/blog/search', { q: term ?? undefined }),
  blogAuthor: (slug: string) => `/blog/authors/${segment(slug)}`,
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
