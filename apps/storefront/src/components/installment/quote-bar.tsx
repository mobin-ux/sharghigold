import Link from 'next/link';

import { instalmentCountLabel } from '@/lib/installment-view';
import { toman } from '@/lib/product-view';

/**
 * The bar above the tab bar: the quoted monthly figure and the way to shop.
 *
 * It repeats the server's quote rather than following the field as it is
 * typed, so it always shows a figure that was actually priced.
 */
export function QuoteBar({
  months,
  monthlyRials,
  href,
}: {
  readonly months: number;
  readonly monthlyRials: string;
  readonly href: string;
}) {
  return (
    <div className="zn-quotebar">
      <span className="zn-quotebar__copy">
        <span className="zn-quotebar__label">
          قسط ماهانه
          {/* Spaced apart: a middot beside Persian digits reads as a zero. */}
          <span className="zn-quotebar__sep" aria-hidden="true">
            ·
          </span>
          <bdi>{instalmentCountLabel(months)}</bdi>
        </span>
        <span className="zn-quotebar__figure">
          <span className="zn-quotebar__value">{toman(monthlyRials)}</span>
          <span className="zn-quotebar__unit">تومان</span>
        </span>
      </span>
      <Link className="zn-quotebar__cta" href={href}>
        خرید اقساطی
      </Link>
    </div>
  );
}
