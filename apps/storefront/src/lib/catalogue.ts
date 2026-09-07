import {
  formatGrams,
  formatToman,
  gramsToMilligrams,
  pricePerGramForKarat,
  quoteGoldPrice,
  toPersianDigits,
  type Rials,
} from '@sharghigold/money';

import {
  DEMO_PROFIT_BASIS_POINTS,
  DEMO_VAT_BASIS_POINTS,
  type DemoProduct,
} from '@/data/demo-catalogue';
import { getGoldRate } from '@/lib/gold-price';

/**
 * A product as the page renders it: text, and nothing else.
 *
 * Everything numeric has already been computed and formatted on the server.
 * Nothing in this object can be arithmetic'd by mistake, and nothing here can
 * be sent back to the server as an authority on what something costs — when an
 * order is placed the price is quoted again from the weight and the rate, and
 * the client's opinion is discarded.
 */
export interface ProductView {
  readonly slug: string;
  readonly href: string;
  readonly title: string;
  readonly category: string;
  /** «۱۸ عیار», «۱٫۸ گرم» — rendered as separate elements, never joined. */
  readonly specs: readonly string[];
  /** Grouped Persian digits, no unit. The card renders «تومان» itself. */
  readonly price: string;
  readonly wasPrice?: string;
  /** Whole percent off the total, derived — never asserted. */
  readonly discountPct?: number;
  readonly installment: boolean;
  readonly inStock: boolean;
}

/** Compute the authoritative total for one product at the current rate. */
function total(product: DemoProduct, makingFeeBasisPoints: number): Rials {
  const rate = getGoldRate();
  const pricePerGram = pricePerGramForKarat(rate.pricePerGram18k, rate.quotedKarat, product.karat);

  return quoteGoldPrice({
    pricePerGram,
    weight: gramsToMilligrams(product.grams),
    makingFeeBasisPoints,
    profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
    vatBasisPoints: DEMO_VAT_BASIS_POINTS,
  }).total;
}

/**
 * Percentage off, floored, computed in integer arithmetic.
 *
 * Floored rather than rounded: a customer who is told «۱۵٪» and computes 14.6%
 * has been overpromised, and the difference is not the shop's to round in its
 * own favour.
 */
function discountPercent(was: Rials, now: Rials): number | undefined {
  if (was <= now) {
    return undefined;
  }
  const percent = ((was - now) * 100n) / was;
  return percent === 0n ? undefined : Number(percent);
}

export function toProductView(product: DemoProduct): ProductView {
  const weight = gramsToMilligrams(product.grams);
  const now = total(
    product,
    product.promotionalMakingFeeBasisPoints ?? product.makingFeeBasisPoints,
  );

  const was =
    product.promotionalMakingFeeBasisPoints === undefined
      ? undefined
      : total(product, product.makingFeeBasisPoints);

  return {
    slug: product.slug,
    href: `/products/${product.slug}`,
    title: product.title,
    category: product.category,
    specs: [`${toPersianDigits(String(product.karat))} عیار`, formatGrams(weight)],
    price: formatToman(now, { withUnit: false }),
    ...(was === undefined ? {} : { wasPrice: formatToman(was, { withUnit: false }) }),
    ...(was === undefined ? {} : withDiscount(was, now)),
    installment: product.installment ?? false,
    inStock: product.inStock ?? true,
  };
}

function withDiscount(was: Rials, now: Rials): { discountPct?: number } {
  const percent = discountPercent(was, now);
  return percent === undefined ? {} : { discountPct: percent };
}

export function toProductViews(products: readonly DemoProduct[]): readonly ProductView[] {
  return products.map(toProductView);
}
