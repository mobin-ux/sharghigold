/**
 * Authoritative gold price calculation.
 *
 * This is the single place a sellable price is derived. The server always
 * recomputes from these inputs; a price arriving from a client is only ever
 * treated as a display echo to be verified, never as an amount to charge
 * (rules 5, 15 and 17).
 *
 * The Iranian retail gold formula:
 *
 *   gold value = spot price per gram x weight
 *   making fee = gold value x making-fee rate            (اجرت)
 *   profit     = (gold value + making fee) x profit rate (سود)
 *   VAT        = (making fee + profit) x VAT rate        (مالیات بر ارزش افزوده)
 *   total      = gold value + making fee + profit + VAT
 *
 * The detail most often implemented wrongly: VAT applies only to the making fee
 * and the profit, never to the value of the gold itself. Applying VAT to the
 * whole subtotal overcharges the customer on every single order.
 *
 * All rates are basis points (1 bp = 0.01%) so no percentage ever becomes a
 * float. Every intermediate line is rounded to a whole rial as it is computed,
 * so the breakdown shown to the customer always re-adds to the stated total.
 */
import {
  addRials,
  MoneyError,
  rials,
  scaleRialsByBasisPoints,
  sumRials,
  type Rials,
} from './rial.js';
import { divideRounded, type RoundingMode } from './rounding.js';
import { MILLIGRAMS_PER_GRAM, type Milligrams } from './weight.js';

export const BASIS_POINTS_SCALE = 10_000;

/** Carats, as used in the Iranian trade. */
export const PURITY = {
  k18: 18,
  k21: 21,
  k22: 22,
  k24: 24,
} as const;

export interface GoldQuoteInput {
  /**
   * Spot price for one gram at the purity of the product itself, in rials.
   * Convert with {@link pricePerGramForKarat} when the feed publishes a
   * different purity.
   */
  readonly pricePerGram: Rials;
  readonly weight: Milligrams;
  /** اجرت — making fee, in basis points of the gold value. */
  readonly makingFeeBasisPoints: number;
  /** سود — seller profit, in basis points of (gold value + making fee). */
  readonly profitBasisPoints: number;
  /** مالیات بر ارزش افزوده — VAT, in basis points of (making fee + profit). */
  readonly vatBasisPoints: number;
  /** Defaults to rounding half away from zero, at whole-rial precision. */
  readonly rounding?: RoundingMode;
}

export interface GoldQuoteBreakdown {
  readonly goldValue: Rials;
  readonly makingFee: Rials;
  readonly profit: Rials;
  readonly vat: Rials;
  readonly total: Rials;
}

/**
 * Convert a per-gram price from one purity to another.
 *
 * Iranian feeds usually publish 18-carat. 18k is 750/1000 fine, the same ratio
 * as 18/24, so carat arithmetic is exact.
 */
export function pricePerGramForKarat(
  pricePerGram: Rials,
  fromKarat: number,
  toKarat: number,
  mode: RoundingMode = 'half-up',
): Rials {
  assertPositiveInteger(fromKarat, 'fromKarat');
  assertPositiveInteger(toKarat, 'toKarat');
  return divideRounded(pricePerGram * BigInt(toKarat), BigInt(fromKarat), mode) as Rials;
}

/** Compute the authoritative price breakdown for a single gold item. */
export function quoteGoldPrice(input: GoldQuoteInput): GoldQuoteBreakdown {
  const {
    pricePerGram,
    weight,
    makingFeeBasisPoints,
    profitBasisPoints,
    vatBasisPoints,
    rounding = 'half-up',
  } = input;

  if (pricePerGram < 0n) {
    throw new MoneyError('pricePerGram must not be negative');
  }
  if (weight < 0n) {
    throw new MoneyError('weight must not be negative');
  }
  assertRate(makingFeeBasisPoints, 'makingFeeBasisPoints');
  assertRate(profitBasisPoints, 'profitBasisPoints');
  assertRate(vatBasisPoints, 'vatBasisPoints');

  const goldValue = divideRounded(pricePerGram * weight, MILLIGRAMS_PER_GRAM, rounding) as Rials;
  const makingFee = scaleRialsByBasisPoints(goldValue, makingFeeBasisPoints, rounding);
  const profit = scaleRialsByBasisPoints(
    addRials(goldValue, makingFee),
    profitBasisPoints,
    rounding,
  );

  // The VAT base deliberately excludes goldValue. See the module comment.
  const vat = scaleRialsByBasisPoints(addRials(makingFee, profit), vatBasisPoints, rounding);

  return {
    goldValue,
    makingFee,
    profit,
    vat,
    total: sumRials([goldValue, makingFee, profit, vat]),
  };
}

/** Quote a line of `quantity` identical items. */
export function quoteGoldLine(input: GoldQuoteInput, quantity: number): GoldQuoteBreakdown {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new MoneyError(`quantity must be a positive integer, received ${String(quantity)}`);
  }
  const unit = quoteGoldPrice(input);
  const q = BigInt(quantity);
  return {
    goldValue: (unit.goldValue * q) as Rials,
    makingFee: (unit.makingFee * q) as Rials,
    profit: (unit.profit * q) as Rials,
    vat: (unit.vat * q) as Rials,
    total: (unit.total * q) as Rials,
  };
}

/**
 * Round a total to a whole multiple of `step` rials.
 * Iranian retail commonly settles to the nearest 1,000 rials.
 */
export function roundTotalToStep(
  total: Rials,
  step: bigint,
  mode: RoundingMode = 'half-up',
): Rials {
  if (step <= 0n) throw new MoneyError('step must be positive');
  return (divideRounded(total, step, mode) * step) as Rials;
}

function assertRate(basisPoints: number, label: string): void {
  if (!Number.isSafeInteger(basisPoints)) {
    throw new MoneyError(`${label} must be an integer number of basis points`);
  }
  if (basisPoints < 0) {
    throw new MoneyError(`${label} must not be negative`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new MoneyError(`${label} must be a positive integer, received ${String(value)}`);
  }
}

/** Re-exported so callers can build inputs without importing three modules. */
export { rials };
