import Link from 'next/link';

import { toPersianDigits } from '@sharghigold/ui';

import { ArrowIcon, CheckIcon } from '@/components/icons';

/**
 * The gold installment panel.
 *
 * The design draws an illustrated scene here. It is decorative and is left to
 * CSS — an illustration that exists only to fill a panel should not be an
 * `<img>` a screen reader has to skip, and should not be markup the page has
 * to download twice on a slow connection.
 *
 * The month count is a prop rather than a constant because it is a commercial
 * term. When the finance rules land it comes from the same place the schedule
 * is generated from, so the panel cannot advertise 36 months while the
 * calculator offers 24.
 */
export function InstallmentCta({ maxMonths }: { readonly maxMonths: number }) {
  const promises = [
    `اقساط تا ${toPersianDigits(maxMonths)} ماه`,
    'بدون چک و ضامن',
    'بدون پیش‌پرداخت',
    'تحویل فوری با فاکتور',
  ];

  return (
    <section className="zn-inst" aria-labelledby="installment-heading">
      <div className="zn-inst__scene" aria-hidden="true" />

      <div className="zn-inst__body">
        <h2 className="zn-inst__title" id="installment-heading">
          طلا را قسطی بخرید
        </h2>
        <p className="zn-inst__lede">
          مبلغ را ماهانه بپردازید و همین امروز سفارشتان را با فاکتور رسمی تحویل بگیرید.
        </p>

        <ul className="zn-inst__promises">
          {promises.map((promise) => (
            <li className="zn-inst__promise" key={promise}>
              <span className="zn-inst__tick">
                <CheckIcon size={16} />
              </span>
              {promise}
            </li>
          ))}
        </ul>

        <Link className="zn-inst__cta" href="/installment">
          شروع خرید اقساطی
          <ArrowIcon size={18} />
        </Link>
        <p className="zn-inst__note">تأیید آنلاین در کمتر از ۵ دقیقه</p>
      </div>
    </section>
  );
}
