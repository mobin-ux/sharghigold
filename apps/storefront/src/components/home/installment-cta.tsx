import Link from 'next/link';

import { toPersianDigits } from '@sharghigold/ui';

import { InstallmentScene } from '@/components/home/installment-scene';
import { ArrowIcon, CardIcon, CheckIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

/**
 * The gold installment panel.
 *
 * The design makes the whole panel one link. Here the link is the call to
 * action alone. A block-level anchor wrapping a heading, a list and a button
 * lookalike is announced as a single enormous link with all of that text as its
 * name, and it makes the four promise chips unselectable. The panel still
 * navigates from the button, which is the part a customer aims at, and the
 * `::after` overlay below restores the whole-panel hit area without putting the
 * copy inside the link.
 *
 * The month count is a prop rather than a constant because it is a commercial
 * term. When the finance rules land it comes from the same place the schedule
 * is generated from, so the panel cannot advertise 36 months while the
 * calculator offers 24.
 */
export function InstallmentCta({
  maxMonths,
  depositPercent,
}: {
  readonly maxMonths: number;
  readonly depositPercent: number;
}) {
  const promises = [
    `اقساط تا ${toPersianDigits(maxMonths)} ماه`,
    'بدون چک و ضامن',
    // Was «بدون پیش‌پرداخت», while checkout takes forty percent on the day.
    // A promise the till will not keep is worse than a smaller promise.
    `پیش‌پرداخت ${toPersianDigits(depositPercent)}٪`,
    'تحویل فوری با فاکتور',
  ];

  return (
    <section className="zn-inst" aria-labelledby="installment-heading">
      <div className="zn-inst__body">
        <div className="zn-inst__scene">
          <InstallmentScene maxMonths={maxMonths} />
        </div>

        <p className="zn-inst__badge">
          <span className="zn-inst__badge-mark" aria-hidden="true">
            <CardIcon size={15} />
          </span>
          <span className="zn-inst__badge-label">خرید اقساطی طلا</span>
        </p>

        <h2 className="zn-inst__title" id="installment-heading">
          طلا را امروز تحویل بگیرید،
          <br />
          قسطش را بعد بدهید
        </h2>
        <p className="zn-inst__lede">بدون قفل‌شدن سرمایه، با فاکتور رسمی و ضمانت اصالت.</p>

        <ul className="zn-inst__promises">
          {promises.map((promise) => (
            <li className="zn-inst__promise" key={promise}>
              <span className="zn-inst__tick" aria-hidden="true">
                <CheckIcon size={16} />
              </span>
              {promise}
            </li>
          ))}
        </ul>

        <Link className="zn-inst__cta" href={routes.installment()}>
          شروع خرید اقساطی
          <ArrowIcon size={18} />
        </Link>
        <p className="zn-inst__note">تأیید آنلاین در کمتر از ۵ دقیقه</p>
      </div>
    </section>
  );
}
