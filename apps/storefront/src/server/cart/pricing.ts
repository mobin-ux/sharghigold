/**
 * What a basket costs.
 *
 * The one place a basket total is produced, and the only figure anything is
 * ever charged against. Every amount is `Rials` — whole rials held as `bigint`
 * — and every rate is basis points, so no part of a price passes through a
 * float (rule 12).
 *
 * The order of operations, which is the part worth being careful about:
 *
 *   1. Each line is quoted from the product's own weight, purity and rates
 *      against the basket's locked gold rate.
 *   2. A making-fee discount is capped, then **allocated across the lines** in
 *      proportion to their fees, so the parts add back to the discount exactly.
 *   3. Each line is re-quoted with its share, which moves the profit and the
 *      VAT that derive from the fee. Charging VAT on a fee the customer did
 *      not pay overcharges them on every discounted order.
 *   4. A gift card is taken off afterwards. It is payment, not a price change,
 *      so it must not reduce the tax the shop remits.
 *   5. Delivery and wrapping are added last, from the shop's own policy.
 *
 * Nothing here reads an amount from a request. The inputs are a basket, a
 * catalogue, a rate and a set of choices; a total that could be influenced by
 * a form field is a total a customer sets (rules 5, 15 and 17).
 */
import type {
  AppliedDiscount,
  BillLine,
  CartTotals,
  DeliveryMode,
  ProductDetail,
  ShippingMethod,
} from '@sharghigold/contracts';
import {
  addWeight,
  allocateRials,
  milligrams,
  multiplyWeightByInteger,
  pricePerGramForKarat,
  quoteGoldLine,
  quoteGoldPrice,
  rials,
  RIALS_PER_TOMAN,
  roundTotalToStep,
  subtractRials,
  sumRials,
  type GoldQuoteBreakdown,
  type Milligrams,
  type Rials,
} from '@sharghigold/money';

import type { CartLineRecord } from '@/server/account/store';
import { discountAmount, type Discount } from '@/server/cart/discounts';
import {
  findShippingChoice,
  GIFT_WRAP,
  shippingCost,
  type ShippingChoice,
} from '@/server/policy/checkout-policy';
import { available } from '@/server/inventory/stock';

const ZERO = rials(0n);

/**
 * Round an amount to a whole toman.
 *
 * The shop quotes tomans, so every figure a customer reads is a whole one —
 * and every figure is therefore *rounded* to one somewhere. Doing it here,
 * once, rather than in the formatter is what makes the breakdown add up: a
 * formatter that truncates each line's rial remainder prints five lines that
 * sum to a toman less than the total printed under them, and a customer who
 * checks the arithmetic finds the shop cannot do it.
 */
function wholeToman(amount: Rials): Rials {
  return roundTotalToStep(amount, RIALS_PER_TOMAN, 'half-up');
}

/** Every part of a line quote, rounded to the unit the shop charges in. */
function toWholeToman(breakdown: GoldQuoteBreakdown): GoldQuoteBreakdown {
  const goldValue = wholeToman(breakdown.goldValue);
  const makingFee = wholeToman(breakdown.makingFee);
  const makingFeeDiscount = wholeToman(breakdown.makingFeeDiscount);
  const profit = wholeToman(breakdown.profit);
  const vat = wholeToman(breakdown.vat);

  return {
    goldValue,
    makingFee,
    makingFeeDiscount,
    profit,
    vat,
    // The total is the sum of what is shown, not a separately rounded figure.
    total: subtractRials(sumRials([goldValue, makingFee, profit, vat]), makingFeeDiscount),
  };
}

export interface PricedLine {
  readonly record: CartLineRecord;
  readonly product: ProductDetail;
  readonly quantity: number;
  readonly weight: Milligrams;
  /** What one of them costs, at list price. Never carries a discount share. */
  readonly unitTotal: Rials;
  readonly breakdown: GoldQuoteBreakdown;
  readonly stockRemaining: number;
  readonly orderable: boolean;
}

export interface BasketQuote {
  readonly lines: readonly PricedLine[];
  readonly weight: Milligrams;
  /** What the pieces come to, discount included, before delivery and wrapping. */
  readonly goodsTotal: Rials;
  readonly goldValue: Rials;
  readonly makingFee: Rials;
  readonly profit: Rials;
  readonly vat: Rials;
  readonly discount: AppliedDiscount | null;
  readonly discountRials: Rials;
  readonly shippingRials: Rials;
  readonly giftRials: Rials;
  readonly total: Rials;
}

export interface BasketChoices {
  readonly discount: Discount | undefined;
  readonly mode: DeliveryMode;
  readonly shipping: ShippingMethod;
  readonly gift: boolean;
}

export const NO_CHOICES: BasketChoices = {
  discount: undefined,
  mode: 'ship',
  shipping: 'post',
  gift: false,
};

/** The per-gram price for this piece, converted from the basket's locked rate. */
function rateFor(product: ProductDetail, ratePerGram18k: Rials): Rials {
  return pricePerGramForKarat(ratePerGram18k, 18, product.karat);
}

function quoteInput(product: ProductDetail, ratePerGram18k: Rials) {
  return {
    pricePerGram: rateFor(product, ratePerGram18k),
    weight: milligrams(BigInt(product.weightMilligrams)),
    makingFeeBasisPoints: product.makingFeeBasisPoints,
    profitBasisPoints: product.profitBasisPoints,
    vatBasisPoints: product.vatBasisPoints,
  } as const;
}

/**
 * Price a whole basket.
 *
 * `products` resolves a slug to the catalogue entry. A line whose product has
 * gone is dropped rather than priced at nothing — a piece that no longer
 * exists cannot be sold, and pricing it as free is the alternative.
 */
export function quoteBasket(
  records: readonly CartLineRecord[],
  products: ReadonlyMap<string, ProductDetail>,
  ratePerGram18k: Rials,
  choices: BasketChoices,
): BasketQuote {
  const present = records
    .map((record) => ({ record, product: products.get(record.productSlug) }))
    .filter(
      (entry): entry is { record: CartLineRecord; product: ProductDetail } =>
        entry.product !== undefined,
    );

  // Pass one: what each line costs at list price, which is what the discount
  // is measured against.
  const listed = present.map(({ record, product }) =>
    quoteGoldLine(quoteInput(product, ratePerGram18k), record.quantity),
  );

  const listedFee = sumRials(listed.map((quote) => quote.makingFee));
  const listedTotal = sumRials(listed.map((quote) => quote.total));

  const discountRials =
    choices.discount === undefined || listedTotal < choices.discount.minimumRials
      ? ZERO
      : discountAmount(choices.discount, listedFee, listedTotal);

  // Only a making-fee code changes what the pieces cost. A gift card is money
  // handed over, so it comes off the payable total further down.
  const feeDiscount = choices.discount?.kind === 'making-fee' ? discountRials : ZERO;

  // Split it across the lines by their share of the fee, so the parts add back
  // to the discount exactly rather than each rounding on its own.
  const shares =
    feeDiscount === ZERO || listedFee === ZERO
      ? listed.map(() => ZERO)
      : allocateRials(
          feeDiscount,
          listed.map((quote) => quote.makingFee),
        );

  const lines: PricedLine[] = present.map(({ record, product }, index) => {
    const share = shares[index] ?? ZERO;
    const breakdown = toWholeToman(
      quoteGoldLine(
        { ...quoteInput(product, ratePerGram18k), makingFeeDiscount: share },
        record.quantity,
      ),
    );
    const stockRemaining = available(record.productSlug);

    return {
      record,
      product,
      quantity: record.quantity,
      weight: multiplyWeightByInteger(
        milligrams(BigInt(product.weightMilligrams)),
        record.quantity,
      ),
      unitTotal: toWholeToman(quoteGoldPrice(quoteInput(product, ratePerGram18k))).total,
      breakdown,
      stockRemaining,
      orderable: product.inStock && stockRemaining >= record.quantity,
    };
  });

  const goldValue = sumRials(lines.map((line) => line.breakdown.goldValue));
  const makingFee = sumRials(lines.map((line) => line.breakdown.makingFee));
  const profit = sumRials(lines.map((line) => line.breakdown.profit));
  const vat = sumRials(lines.map((line) => line.breakdown.vat));
  const priced = sumRials(lines.map((line) => line.breakdown.total));

  // What the discount is actually worth, once every line's share has been
  // rounded to the unit it is shown in. Taking the unrounded figure would
  // print a discount a toman away from the one the lines received.
  const feeSaved = sumRials(lines.map((line) => line.breakdown.makingFeeDiscount));

  // A gift card comes off here, after tax, and never below zero.
  const giftCard = choices.discount?.kind === 'gift-card' ? wholeToman(discountRials) : ZERO;
  const goodsTotal = (priced > giftCard ? subtractRials(priced, giftCard) : ZERO) as Rials;

  const choice: ShippingChoice | undefined =
    choices.mode === 'pickup' ? undefined : findShippingChoice(choices.shipping);

  // Measured against the value of the goods, so a gift card cannot cost a
  // customer their free delivery and wrapping cannot buy it.
  const shippingRials = choice === undefined ? ZERO : shippingCost(choice, priced);
  const giftRials = choices.gift ? GIFT_WRAP.costRials : ZERO;

  /** What the bill prints on its discount line, whichever kind it is. */
  const shown = choices.discount?.kind === 'gift-card' ? giftCard : feeSaved;

  return {
    lines,
    weight: lines.reduce((total, line) => addWeight(total, line.weight), milligrams(0n)),
    goodsTotal,
    goldValue,
    makingFee,
    profit,
    vat,
    discount:
      choices.discount === undefined || shown === ZERO
        ? null
        : {
            code: choices.discount.code,
            kind: choices.discount.kind,
            label: choices.discount.label,
            amountRials: shown.toString(),
          },
    discountRials: shown,
    shippingRials,
    giftRials,
    total: sumRials([goodsTotal, shippingRials, giftRials]),
  };
}

/**
 * The bill, as «جزئیات قیمت» lists it.
 *
 * Built from the quote rather than recomputed, and it re-adds to the total
 * exactly: gold value plus the full making fee, less the discount, plus profit
 * and VAT on what was left of the fee, plus wrapping and delivery.
 */
export function billLines(quote: BasketQuote): readonly BillLine[] {
  const lines: BillLine[] = [
    { kind: 'gold-value', amountRials: quote.goldValue.toString(), detail: null },
    { kind: 'making-fee', amountRials: quote.makingFee.toString(), detail: null },
    { kind: 'profit', amountRials: quote.profit.toString(), detail: null },
    { kind: 'vat', amountRials: quote.vat.toString(), detail: null },
  ];

  if (quote.discount !== null) {
    lines.push({
      kind: 'discount',
      amountRials: `-${quote.discount.amountRials}`,
      detail: quote.discount.label,
    });
  }

  if (quote.giftRials > 0n) {
    lines.push({ kind: 'gift-wrap', amountRials: quote.giftRials.toString(), detail: null });
  }

  return lines;
}

/** The totals block the contract carries, from the same quote. */
export function cartTotals(quote: BasketQuote, payNow: Rials, delivery: BillLine): CartTotals {
  return {
    weightMilligrams: quote.weight.toString(),
    lines: [...billLines(quote), delivery],
    itemsRials: quote.goodsTotal.toString(),
    discountRials: quote.discountRials.toString(),
    shippingRials: quote.shippingRials.toString(),
    giftRials: quote.giftRials.toString(),
    totalRials: quote.total.toString(),
    payNowRials: payNow.toString(),
  };
}

/** The delivery line, which reads differently for collection. */
export function deliveryLine(quote: BasketQuote, mode: DeliveryMode): BillLine {
  return mode === 'pickup'
    ? { kind: 'pickup', amountRials: '0', detail: null }
    : { kind: 'shipping', amountRials: quote.shippingRials.toString(), detail: null };
}
