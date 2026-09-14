import Link from 'next/link';

import { BankCardIcon } from '@/components/icons';
import { INSTALLMENT_HINT } from '@/config/commerce-terms';
import { routes } from '@/lib/routes';

/**
 * «همین گوشواره را قسطی بخرید», under a category's grid.
 *
 * The canvas promises «تا ۳۶ ماه، بدون چک و ضامن». The terms checkout actually
 * offers are a deposit and at most eighteen months, so the second line is
 * `INSTALLMENT_HINT` — the one sentence every instalment surface prints, from
 * the one place those terms are defined.
 */
export function InstallmentBanner({
  noun,
  categorySlug,
}: {
  /** «گوشواره». */
  readonly noun: string;
  readonly categorySlug: string;
}) {
  return (
    <section className="zn-instbanner" aria-label="خرید اقساطی">
      <span className="zn-instbanner__icon">
        <BankCardIcon size={22} strokeWidth={1.7} />
      </span>
      <span className="zn-instbanner__text">
        <span className="zn-instbanner__title">{`همین ${noun} را قسطی بخرید`}</span>
        <span className="zn-instbanner__hint">{INSTALLMENT_HINT}</span>
      </span>
      <Link className="zn-instbanner__link" href={routes.installment({ category: categorySlug })}>
        شرایط
      </Link>
    </section>
  );
}
