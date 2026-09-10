'use client';

import Link from 'next/link';

import { ChevronIcon } from '@/components/icons';
import { PolicyIcon } from '@/components/product/policy-icon';
import { usePurchase } from '@/components/product/purchase-context';
import { persianCount } from '@/lib/product-view';
import type { PolicyIcon as PolicyIconKey } from '@/server/policy/shop-policy';

/**
 * The four ways out of the product page.
 *
 * Three go somewhere and one opens the size sheet, so three are links and one
 * is a button. The canvas makes all four buttons and navigates with
 * `window.location`; that costs the middle-click, the long-press menu, the
 * hover preview and the crawler — everything a link is for.
 */
export function ProductLinks({
  slug,
  installmentHref,
  answeredQuestions,
}: {
  readonly slug: string;
  readonly installmentHref: string;
  readonly answeredQuestions: number;
}) {
  const { openSizeGuide } = usePurchase();

  const rows: readonly {
    readonly key: string;
    readonly icon: PolicyIconKey;
    readonly title: string;
    readonly hint: string;
    readonly href?: string;
  }[] = [
    {
      key: 'questions',
      icon: 'chat',
      title: 'پرسش و پاسخ خریداران',
      hint:
        answeredQuestions === 0
          ? 'هنوز پرسشی ثبت نشده — اولین نفر باشید'
          : `${persianCount(answeredQuestions)} پرسش پاسخ‌داده‌شده · پاسخ در کمتر از ۳ ساعت`,
      href: `/products/${slug}/questions`,
    },
    {
      key: 'shipping',
      icon: 'delivery',
      title: 'ارسال، مرجوعی و ضمانت',
      hint: 'ارسال بیمه‌شده رایگان · بازگشت ۷ روزه',
      href: `/products/${slug}/shipping`,
    },
    {
      key: 'size-guide',
      icon: 'ruler',
      title: 'راهنمای انتخاب سایز',
      hint: 'جدول اندازه دور انگشت بر حسب میلی‌متر',
    },
    {
      key: 'installment',
      icon: 'calculator',
      title: 'محاسبه خرید اقساطی',
      hint: 'تا ۳۶ ماه، بدون چک و ضامن',
      href: `${installmentHref}#calculator`,
    },
  ];

  return (
    <nav className="zn-links" aria-label="اطلاعات بیشتر درباره این محصول">
      {rows.map((row) => {
        const body = (
          <>
            <span className="zn-links__mark">
              <PolicyIcon icon={row.icon} />
            </span>
            <span className="zn-links__text">
              <span className="zn-links__title">{row.title}</span>
              <span className="zn-links__hint">{row.hint}</span>
            </span>
            <span className="zn-links__chev" aria-hidden="true">
              <ChevronIcon size={17} strokeWidth={1.8} />
            </span>
          </>
        );

        return row.href === undefined ? (
          <button className="zn-links__row" key={row.key} type="button" onClick={openSizeGuide}>
            {body}
          </button>
        ) : (
          <Link className="zn-links__row" key={row.key} href={row.href}>
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
