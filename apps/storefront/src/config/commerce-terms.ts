/**
 * The numbers behind the shop's commercial promises.
 *
 * Separate from `server/policy/shop-policy.ts`, which holds the same terms
 * written out as sentences. The split is not tidiness: the sentences are long
 * Persian copy that belongs on the server, while these four values are needed
 * by client components too — the instalment hint on a product page, the
 * countdown on a price lock — and pulling the whole policy module into a
 * client bundle to read one integer is how a bundle gets large.
 *
 * There is nothing secret here. Every value is already printed on a page.
 *
 * When the admin panel exists, this is the table it edits: these are exactly
 * the terms a merchant changes without a deploy. `shop-policy.ts` re-exports
 * them, so no caller has to know which of the two files a term lives in.
 */

/**
 * How long a quoted price is honoured, in seconds.
 *
 * Five minutes, which is what the basket tells the customer and what the FAQ
 * repeats. Shortening it is a decision about how much rate movement the shop
 * absorbs, not an arithmetic detail.
 */
export const PRICE_LOCK_SECONDS = 300;

/**
 * The margin and tax applied on top of gold and making fee.
 *
 * These were previously declared twice — 900 basis points in the product
 * fixtures and 1,000 in the homepage seed — so the same piece was taxed at two
 * rates depending on which page a customer was looking at. Ten percent is the
 * statutory rate, and it is charged on the making fee and the margin only,
 * never on the gold, which `@sharghigold/money` enforces.
 */
export const CATALOGUE_RATES = {
  /** سود فروشنده — the retailer's margin, in basis points. */
  profitBasisPoints: 700,
  /** مالیات بر ارزش افزوده — VAT, in basis points. */
  vatBasisPoints: 1_000,
} as const;

/**
 * The one instalment agreement the shop offers.
 *
 * Iranian instalment retail is «فروش اقساطی»: a deposit today, the balance
 * spread over a term, and a surcharge on the balance that makes the instalment
 * price higher than the cash price. All three parts are here because all three
 * are one commercial promise — a page that quoted a term this table does not
 * offer, or a monthly figure derived from a different rate, would be the shop
 * advertising terms checkout will not honour, which is exactly what the
 * homepage, the product page and an answered question were all doing.
 *
 * Rates are basis points, so no percentage ever becomes a float.
 */
export const INSTALLMENT = {
  /** Terms offered, in months. */
  terms: [6, 12, 18],
  /** پیش‌پرداخت — taken on the day the order is placed. */
  depositBasisPoints: 4_000,
  /** Surcharge on the financed balance, per month of the term. */
  monthlySurchargeBasisPoints: 200,
} as const;

/** Whole percent, for copy. Basis points are the authority; this is the label. */
export const INSTALLMENT_DEPOSIT_PERCENT = INSTALLMENT.depositBasisPoints / 100;

/** The longest term offered, for «تا ۱۸ ماه». */
export const INSTALLMENT_MAX_MONTHS = Math.max(...INSTALLMENT.terms);

/**
 * The one-line summary of the agreement, used wherever a page mentions it in
 * passing rather than in full.
 *
 * Derived, so it cannot say 36 months while the calculator offers 18.
 */
export const INSTALLMENT_HINT = `پیش‌پرداخت ${toPersian(INSTALLMENT_DEPOSIT_PERCENT)}٪، تا ${toPersian(INSTALLMENT_MAX_MONTHS)} ماه، بدون چک و ضامن`;

/**
 * Latin digits to Persian.
 *
 * Written out here rather than imported from `@sharghigold/ui` so this module
 * has no dependencies at all and can be read from anywhere — including a test
 * that is checking the terms rather than rendering them.
 */
function toPersian(value: number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
}
