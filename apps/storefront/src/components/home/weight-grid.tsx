import Link from 'next/link';

import { formatToman, gramsToMilligrams, quoteGoldPrice, type Rials } from '@sharghigold/money';

import { SectionHeader } from '@/components/home/section-header';
import { DEMO_PROFIT_BASIS_POINTS, DEMO_VAT_BASIS_POINTS } from '@/data/demo-catalogue';
import { getGoldRate } from '@/lib/gold-price';

interface Band {
  readonly slug: string;
  readonly label: string;
  readonly note: string;
  /** Lightest piece in the band, in grams. Sets the «از …» figure. */
  readonly fromGrams: string;
  /** How many of the four bars are lit. */
  readonly filled: 1 | 2 | 3 | 4;
}

const BANDS: readonly Band[] = [
  { slug: 'under-2g', label: 'زیر ۲ گرم', note: 'هدیه و روزمره', fromGrams: '1.2', filled: 1 },
  { slug: '2-to-5g', label: '۲ تا ۵ گرم', note: 'پرفروش‌ترین بازه', fromGrams: '2', filled: 2 },
  { slug: '5-to-10g', label: '۵ تا ۱۰ گرم', note: 'مجلسی و سرویس', fromGrams: '5', filled: 3 },
  { slug: 'over-10g', label: 'بالای ۱۰ گرم', note: 'سرمایه‌ای', fromGrams: '10', filled: 4 },
];

/** Typical making fee used for the indicative «from» price on a weight band. */
const INDICATIVE_MAKING_FEE_BASIS_POINTS = 1_500;

function startingPrice(grams: string): Rials {
  return quoteGoldPrice({
    pricePerGram: getGoldRate().pricePerGram18k,
    weight: gramsToMilligrams(grams),
    makingFeeBasisPoints: INDICATIVE_MAKING_FEE_BASIS_POINTS,
    profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
    vatBasisPoints: DEMO_VAT_BASIS_POINTS,
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
            <Link className="zn-weight" href={`/products?weight=${band.slug}`}>
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
