'use client';

import Link from 'next/link';
import type { PriceQuote, ProductDetail } from '@sharghigold/contracts';

import { addProductToCart } from '@/app/cart/actions';
import { SubmitButton } from '@/components/account/submit-button';
import { ArrowIcon } from '@/components/icons';
import { BottomSheet } from '@/components/product/bottom-sheet';
import { useChosenSummary, usePurchase } from '@/components/product/purchase-context';
import { lockLabel, persianCount, toman, weightLabel } from '@/lib/product-view';
import { routes } from '@/lib/routes';

/**
 * The bar pinned to the bottom of the product page, and the sheet it opens.
 *
 * The price and the countdown are the same values the card further up shows,
 * from the same provider, so the two can never disagree.
 *
 * Confirming here does not place an order and does not reserve anything. It
 * opens a summary of what is about to be bought, and the piece then goes into
 * the basket — where it is priced again, on the server, against the basket's
 * own locked rate.
 *
 * What the form sends is the product, the size and the colour. No amount
 * crosses: the total shown here is a display echo of the server's quote, and
 * the figure a customer is eventually charged is computed from the catalogue
 * at the moment the order is placed (rules 5, 15 and 17).
 */
export function BuyBar({
  product,
  quote,
}: {
  readonly product: ProductDetail;
  readonly quote: PriceQuote;
}) {
  const { secondsRemaining, sheet, openCheckout, closeSheet, size, colour } = usePurchase();

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
          {/* The choice travels as three fields and nothing else. The action
              checks the size and the colour against the product itself, so a
              request naming one this page never offered is refused there. */}
          <form action={addProductToCart}>
            <input type="hidden" name="slug" value={product.slug} />
            <input type="hidden" name="size" value={size ?? ''} />
            <input type="hidden" name="colour" value={colour} />
            <SubmitButton className="zn-confirm__pay" pendingLabel="در حال افزودن…">
              افزودن به سبد خرید
              <ArrowIcon size={17} strokeWidth={2} />
            </SubmitButton>
          </form>
          <Link className="zn-confirm__instal" href={routes.cart()}>
            مشاهده سبد خرید
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
