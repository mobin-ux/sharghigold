/**
 * @sharghigold/money — exact arithmetic for gold, money and their presentation.
 *
 * Nothing in this package uses floating point. Amounts are whole rials and
 * weights are whole milligrams, both held as `bigint`, so results are exact
 * regardless of magnitude and are identical on every platform.
 *
 * This package is pure: no I/O, no clock, no configuration. That makes the
 * business rules that matter most exhaustively testable.
 */

export { divideRounded, RoundingError, type RoundingMode } from './rounding.js';

export {
  absRials,
  addRials,
  allocateRials,
  isNegativeRials,
  MoneyError,
  multiplyRialsByInteger,
  negateRials,
  rials,
  scaleRialsByBasisPoints,
  subtractRials,
  sumRials,
  ZERO_RIALS,
  type Rials,
} from './rial.js';

export {
  addWeight,
  gramsToMilligrams,
  MILLIGRAMS_PER_GRAM,
  milligrams,
  milligramsToGramString,
  multiplyWeightByInteger,
  scaleWeight,
  WeightError,
  type Milligrams,
} from './weight.js';

export {
  BASIS_POINTS_SCALE,
  PURITY,
  pricePerGramForKarat,
  quoteGoldLine,
  quoteGoldPrice,
  roundTotalToStep,
  type GoldQuoteBreakdown,
  type GoldQuoteInput,
} from './gold-pricing.js';

export {
  formatBasisPointsAsPercent,
  formatGrams,
  formatToman,
  groupThousands,
  PERSIAN_DECIMAL_SEPARATOR,
  PERSIAN_THOUSANDS_SEPARATOR,
  RIALS_PER_TOMAN,
  rialsToToman,
  rialsToTomanExact,
  toLatinDigits,
  toPersianDigits,
  type GramFormatOptions,
  type TomanFormatOptions,
} from './format.js';
