import Link from 'next/link';

import { formatToman, gramsToMilligrams, quoteGoldPrice, type Rials } from '@sharghigold/money';

import { SectionHeader } from '@/components/home/section-header';
import { getGoldRate } from '@/lib/gold-price';
import { routes } from '@/lib/routes';
import { CATALOGUE_RATES } from '@/server/policy/shop-policy';

interface Band {
  readonly slug: string;
  readonly label: string;
  readonly note: string;
  /** Lightest piece in the band, in grams. Sets the «از …» figure. */
  readonly fromGrams: string;
  /**
   * The listing filter this band means, in whole milligrams.
   *
   * The tile used to link to `/products?weight=under-2g`, which is not a
   * filter the listing has ever understood — so every band showed the whole
   * shop. A band is a weight range, and this is that range in the unit the
   * catalogue stores.
   */
  readonly minWeightMg?: string;
  readonly maxWeightMg?: string;
  /** How many of the four bars are lit. */
  readonly filled: 1 | 2 | 3 | 4;
}

const BANDS: readonly Band[] = [
  {
    slug: 'under-2g',
    label: 'زیر ۲ گرم',
    note: 'هدیه و روزمره',
    fromGrams: '1.2',
    maxWeightMg: '2000',
    filled: 1,
  },
  {
    slug: '2-to-5g',
    label: '۲ تا ۵ گرم',
    note: 'پرفروش‌ترین بازه',
    fromGrams: '2',
    minWeightMg: '2000',
    maxWeightMg: '5000',
    filled: 2,
  },
  {
    slug: '5-to-10g',
    label: '۵ تا ۱۰ گرم',
    note: 'مجلسی و سرویس',
    fromGrams: '5',
    minWeightMg: '5000',
    maxWeightMg: '10000',
    filled: 3,
  },
  {
    slug: 'over-10g',
    label: 'بالای ۱۰ گرم',
    note: 'سرمایه‌ای',
    fromGrams: '10',
    minWeightMg: '10000',
    filled: 4,
  },
];

/** Typical making fee used for the indicative «from» price on a weight band. */
const INDICATIVE_MAKING_FEE_BASIS_POINTS = 1_500;

function startingPrice(grams: string): Rials {
  return quoteGoldPrice({
    pricePerGram: getGoldRate().pricePerGram18k,
    weight: gramsToMilligrams(grams),
    makingFeeBasisPoints: INDICATIVE_MAKING_FEE_BASIS_POINTS,
    profitBasisPoints: CATALOGUE_RATES.profitBasisPoints,
    vatBasisPoints: CATALOGUE_RATES.vatBasisPoints,
  }).total;
}

/**
 * Shop by weight.
 *
 * The «از …» figure is computed from the band's lightest weight at the current
 * rate, not stored. A starting price that was typed in once is a starting
 * price that is wrong the next time gold moves, and «از ۱٬۴۲۰٬۰۰۰ تومان» on a
 * product that now costs more is a promise the shop did not mean to make.
 */
export function WeightGrid() {
  return (
    <section className="zn-section" aria-labelledby="weights-heading">
      <SectionHeader id="weights-heading" title="خرید بر اساس وزن" gap={6} />
      <p className="zn-section__lede">
        وزن، تعیین‌کننده قیمت طلاست. بازه وزنی دلخواهتان را انتخاب کنید تا مدل‌های متناسب با بودجه
        شما را ببینید.
      </p>

      <ul className="zn-weights">
        {BANDS.map((band) => (
          <li key={band.slug}>
            <Link
              className="zn-weight"
              href={routes.products({
                ...(band.minWeightMg === undefined ? {} : { minWeightMg: band.minWeightMg }),
                ...(band.maxWeightMg === undefined ? {} : { maxWeightMg: band.maxWeightMg }),
                sort: 'price-asc',
              })}
            >
              <span className="zn-weight__bars" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    className={`zn-weight__bar${step <= band.filled ? ' zn-weight__bar--on' : ''}`}
                    key={step}
                  />
                ))}
              </span>
              <span className="zn-weight__text">
                <span className="zn-weight__label">{band.label}</span>
                <span className="zn-weight__note">{band.note}</span>
              </span>
              <span className="zn-weight__from">
                <span className="zn-weight__from-word">از</span>
                <span className="zn-weight__price">
                  {formatToman(startingPrice(band.fromGrams), { withUnit: false })}
                </span>
                <span className="zn-weight__unit">تومان</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
