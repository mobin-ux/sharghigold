import Link from 'next/link';
import { toPersianDigits } from '@sharghigold/ui';
import type { CategoryNavigationEntry } from '@sharghigold/contracts';

import { BankCardIcon, ChevronIcon } from '@/components/icons';

/** Longest instalment term offered. A commercial term, not a layout constant. */
const MAX_INSTALLMENT_MONTHS = 36;

/**
 * The sticky bar naming the category on show, and the way into its listing.
 *
 * The count arrives as a number and is turned into Persian numerals here. That
 * split matters: the catalogue knows there are 248 earrings, and the storefront
 * knows this locale writes that «۲۴۸». Sending the formatted string would bake
 * a locale into the API and make the number unusable for anything but display.
 */
export function CategoryPanelHead({ category }: { readonly category: CategoryNavigationEntry }) {
  return (
    <Link className="zn-catpanel__head" href={`/categories/${category.slug}`}>
      <span className="zn-catpanel__head-text">
        <span className="zn-catpanel__title">{category.title}</span>
        <span className="zn-catpanel__meta">
          {toPersianDigits(category.productCount)} کالا · مشاهده همه
        </span>
      </span>
      <span className="zn-catpanel__chevron">
        <ChevronIcon size={15} strokeWidth={2.2} />
      </span>
    </Link>
  );
}

/**
 * The instalment offer, shown for every category that can carry one.
 *
 * Bullion is the exception and the catalogue says so (`installmentEligible`),
 * rather than this component knowing which categories are special.
 */
export function InstallmentBanner({ category }: { readonly category: CategoryNavigationEntry }) {
  return (
    <Link
      className="zn-catbanner"
      href={`/installment?category=${encodeURIComponent(category.slug)}`}
    >
      <span className="zn-catbanner__icon">
        <BankCardIcon />
      </span>
      <span className="zn-catbanner__text">
        <span className="zn-catbanner__title">خرید اقساطی {category.title}</span>
        <span className="zn-catbanner__note">
          تا {toPersianDigits(MAX_INSTALLMENT_MONTHS)} ماه، بدون چک و ضامن
        </span>
      </span>
    </Link>
  );
}
