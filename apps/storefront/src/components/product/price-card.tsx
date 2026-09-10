'use client';

import { useState } from 'react';
import type { PriceQuote, ProductDetail } from '@sharghigold/contracts';

import { ChevronDownIcon, LockClockIcon } from '@/components/icons';
import { usePurchase } from '@/components/product/purchase-context';
import { lockLabel, persianCount, priceLineLabel, toman } from '@/lib/product-view';

/**
 * The price, what it is made of, and how long it stands.
 *
 * Every figure here was computed on the server in whole rials and arrived as a
 * string. Nothing in this component does arithmetic on money: the breakdown
 * lines add up to the total because the server added them, not because the
 * browser did it again and happened to agree.
 *
 * The breakdown is a disclosure rather than always-on, as the canvas has it.
 * It is worth having: a customer who can see that VAT is charged on the making
 * fee and the profit but not on the metal can check the invoice, and a shop
 * that shows the working is making a claim it can be held to.
 */
export function PriceCard({
  product,
  quote,
}: {
  readonly product: ProductDetail;
  readonly quote: PriceQuote;
}) {
  const [open, setOpen] = useState(false);
  const { secondsRemaining } = usePurchase();

  const expired = secondsRemaining === 0;

  return (
    <section className="zn-price" aria-label="قیمت">
      {/* The canvas calls this «نرخ لحظه‌ای» — a live rate. There is no market
          feed yet, so saying so would be a claim the shop cannot back. Until
          `isLive` is true this names the figure for what it is and dates it. */}
      <div className="zn-price__rate">
        <span
          className={`zn-price__pulse${quote.rate.isLive ? ' zn-price__pulse--live' : ''}`}
          aria-hidden="true"
        />
        <span className="zn-price__ratelabel">
          {quote.rate.isLive ? 'نرخ لحظه‌ای' : 'نرخ مرجع'} طلای{' '}
          {persianCount(quote.rate.quotedKarat)} عیار
        </span>
        <span className="zn-price__ratevalue">
          {toman(quote.rate.pricePerGramRials)}{' '}
          <span className="zn-price__rateunit">تومان/گرم</span>
        </span>
      </div>

      <div className="zn-price__body">
        <div className="zn-price__headline">
          <span className="zn-price__final">
            <span className="zn-price__caption">قیمت نهایی</span>
            <span className="zn-price__amount">
              <span className="zn-price__figure">{toman(quote.totalRials)}</span>
              <span className="zn-price__unit">تومان</span>
            </span>
          </span>

          <span
            className={`zn-price__lock${expired ? ' zn-price__lock--expired' : ''}`}
            // Announced once when it changes meaningfully, not every second:
            // a live region that speaks a countdown is unusable.
            aria-label={expired ? 'مهلت قیمت به پایان رسید' : 'مهلت باقی‌مانده قیمت'}
          >
            <LockClockIcon />
            <span className="zn-price__clock">{lockLabel(secondsRemaining)}</span>
          </span>
        </div>

        <p className="zn-price__note" role={expired ? 'status' : undefined}>
          {expired
            ? 'مهلت این قیمت به پایان رسید. در حال دریافت نرخ تازه…'
            : 'قیمت تا پایان این زمان برای شما ثابت می‌ماند و پس از آن با نرخ روز به‌روزرسانی می‌شود.'}
        </p>

        <button
          className="zn-price__toggle"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((was) => !was)}
        >
          <span>جزئیات محاسبه قیمت</span>
          <span className={`zn-price__chev${open ? ' zn-price__chev--open' : ''}`}>
            <ChevronDownIcon size={16} />
          </span>
        </button>

        <div className="zn-price__breakdown" hidden={!open}>
          {quote.lines.map((line) => (
            <div className="zn-price__line" key={line.kind}>
              <span className="zn-price__linelabel">
                {priceLineLabel(line, product.weightMilligrams)}
              </span>
              <span className="zn-price__linevalue">{toman(line.amountRials)}</span>
            </div>
          ))}

          <div className="zn-price__sum">
            <span className="zn-price__sumlabel">جمع کل</span>
            <span className="zn-price__sumvalue">
              {toman(quote.totalRials)} <span className="zn-price__unit">تومان</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
