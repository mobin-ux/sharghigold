import type { CartTotals } from '@sharghigold/contracts';

import { billLabel, billTone, billValue, toman, weightLabel } from '@/lib/cart-view';

/**
 * «جزئیات قیمت» — the breakdown and what it comes to.
 *
 * Every line is the server's, in order, and they add to the total printed
 * underneath. That is the point of showing it at all: a customer can check the
 * gold value against the day's rate and the weight beside the heading, and the
 * VAT against the making fee and profit above it.
 *
 * A `<dl>` rather than a stack of rows, because that is what a list of named
 * amounts is, and it is what lets a screen reader pair each figure with its
 * label instead of reading eight numbers in a row.
 */
export function BillPanel({
  totals,
  title = 'جزئیات قیمت',
  payLabel = 'مبلغ قابل پرداخت',
  note,
}: {
  readonly totals: CartTotals;
  readonly title?: string;
  readonly payLabel?: string;
  readonly note?: string;
}) {
  return (
    <section className="zn-bill" aria-label={title}>
      <div className="zn-bill__head">
        <h2 className="zn-bill__title">{title}</h2>
        <span className="zn-bill__weight">وزن کل {weightLabel(totals.weightMilligrams)}</span>
      </div>

      <dl className="zn-bill__rows">
        {totals.lines.map((line) => (
          <div className="zn-bill__row" key={`${line.kind}-${line.amountRials}`}>
            <dt className="zn-bill__label">{billLabel(line, totals.weightMilligrams)}</dt>
            <dd className={`zn-bill__value zn-bill__value--${billTone(line)}`}>
              {billValue(line)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="zn-bill__total">
        <span className="zn-bill__totallabel">{payLabel}</span>
        <span className="zn-bill__totalamount">
          <span className="zn-bill__totalfigure">{toman(totals.payNowRials)}</span>
          <span className="zn-bill__totalunit">تومان</span>
        </span>
      </p>

      {note === undefined ? null : <p className="zn-bill__note">{note}</p>}
    </section>
  );
}
