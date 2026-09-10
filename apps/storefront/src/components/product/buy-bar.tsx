'use client';

import Link from 'next/link';
import type { PriceQuote, ProductDetail } from '@sharghigold/contracts';

import { ArrowIcon } from '@/components/icons';
import { BottomSheet } from '@/components/product/bottom-sheet';
import { useChosenSummary, usePurchase } from '@/components/product/purchase-context';
import { lockLabel, persianCount, toman, weightLabel } from '@/lib/product-view';

/**
 * The bar pinned to the bottom of the product page, and the sheet it opens.
 *
 * The price and the countdown are the same values the card further up shows,
 * from the same provider, so the two can never disagree.
 *
 * Confirming here does not place an order and does not reserve anything. It
 * opens a summary of what is about to be bought, and the order itself is made
 * on the checkout page against a price the server quotes again at that moment.
 * A total that travelled through this component is a display echo; it is never
 * what is charged (rules 5, 15 and 17).
 */
export function BuyBar({
  product,
  quote,
}: {
  readonly product: ProductDetail;
  readonly quote: PriceQuote;
}) {
  const { secondsRemaining, sheet, openCheckout, closeSheet, size } = usePurchase();

  const chosen = useChosenSummary(
    product,
    `${persianCount(product.karat)} عیار · ${weightLabel(product.weightMilligrams)}`,
  );

  const sellable = product.inStock && size !== null;

  return (
    <>
      <div className="zn-buybar">
        <button
          className="zn-buybar__cta"
          type="button"
          disabled={!sellable}
          onClick={openCheckout}
        >
          {sellable ? 'ثبت سفارش و پرداخت' : 'فعلاً موجود نیست'}
        </button>

        <span className="zn-buybar__price">
          <span className="zn-buybar__amount">
            <span className="zn-buybar__figure">{toman(quote.totalRials)}</span>
            <span className="zn-buybar__unit">تومان</span>
          </span>
          <span className="zn-buybar__lock">
            {secondsRemaining === 0
              ? 'در حال دریافت نرخ تازه'
              : `${lockLabel(secondsRemaining)} تا پایان قفل نرخ`}
          </span>
        </span>
      </div>

      <BottomSheet open={sheet === 'checkout'} onClose={closeSheet} title="نهایی‌سازی خرید">
        <div className="zn-confirm__item">
          <span className="zn-confirm__thumb" aria-hidden="true" />
          <span className="zn-confirm__text">
            <span className="zn-confirm__name">{product.title}</span>
            <span className="zn-confirm__chosen">{chosen}</span>
          </span>
        </div>

        <dl className="zn-confirm__figures">
          <div className="zn-confirm__row">
            <dt>قیمت قفل‌شده</dt>
            <dd className="zn-confirm__total">
              {toman(quote.totalRials)} <span className="zn-confirm__unit">تومان</span>
            </dd>
          </div>
          <div className="zn-confirm__row">
            <dt>مهلت پرداخت با این نرخ</dt>
            <dd className="zn-confirm__clock">
              <span className="zn-confirm__pulse" aria-hidden="true" />
              {lockLabel(secondsRemaining)}
            </dd>
          </div>
        </dl>

        <p className="zn-confirm__note">
          با ثبت سفارش، این قطعه به نام شما کنار گذاشته می‌شود و با فاکتور رسمی و ضمانت اصالت ارسال
          می‌گردد.
        </p>

        <div className="zn-confirm__actions">
          <Link className="zn-confirm__pay" href={`/checkout?product=${product.slug}`}>
            پرداخت و نهایی‌سازی خرید
            <ArrowIcon size={17} strokeWidth={2} />
          </Link>
          <Link className="zn-confirm__instal" href={`/installment?product=${product.slug}`}>
            خرید اقساطی همین قطعه
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
