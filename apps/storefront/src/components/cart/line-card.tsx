import Link from 'next/link';
import type { CartLine } from '@sharghigold/contracts';

import { changeQuantity, keepLineForLater, removeFromCart } from '@/app/cart/actions';
import { ConfirmButton } from '@/components/account/confirm-button';
import { QuantityForm } from '@/components/cart/quantity-form';
import { BookmarkIcon, TrashIcon } from '@/components/icons';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { lineSpec, LOW_STOCK_AT, lowStockNote, toman } from '@/lib/cart-view';

/**
 * One piece in the basket.
 *
 * Three controls: how many, set aside for later, and remove. Removal asks
 * first, and the question offers to save the piece instead — which is what the
 * design's own sheet does, and the right thing to offer when the alternative
 * is losing a choice somebody spent time making.
 *
 * The unit price is only shown where it tells you something, which is when
 * there is more than one. Below it, the stock note appears only when stock is
 * genuinely nearly gone; a shop that says «only 9 left» about everything is a
 * shop nobody believes.
 */
export function CartLineCard({ line }: { readonly line: CartLine }) {
  return (
    <article className={line.orderable ? 'zn-cline' : 'zn-cline zn-cline--blocked'}>
      <div className="zn-cline__top">
        <Link className="zn-cline__shot" href={`/products/${line.productSlug}`} tabIndex={-1}>
          <MediaPlaceholder label="عکس کالا" />
        </Link>

        <div className="zn-cline__body">
          <h3 className="zn-cline__title">
            <Link className="zn-cline__link" href={`/products/${line.productSlug}`}>
              {line.title}
            </Link>
          </h3>
          <p className="zn-cline__spec">{lineSpec(line)}</p>

          <p className="zn-cline__price">
            <span className="zn-cline__figure">{toman(line.lineTotalRials)}</span>
            <span className="zn-cline__unit">تومان</span>
          </p>

          {line.quantity > 1 ? (
            <p className="zn-cline__each">هر عدد {toman(line.unitTotalRials)} تومان</p>
          ) : null}
        </div>
      </div>

      <div className="zn-cline__tools">
        <QuantityForm
          action={changeQuantity}
          lineId={line.id}
          quantity={line.quantity}
          max={line.stockRemaining}
        />

        <form className="zn-cline__keep-form" action={keepLineForLater}>
          <input type="hidden" name="line" value={line.id} />
          <button className="zn-cline__keep" type="submit">
            <BookmarkIcon size={14} strokeWidth={1.8} />
            ذخیره برای بعد
          </button>
        </form>

        <ConfirmButton
          action={removeFromCart}
          className="zn-cline__drop"
          label={<TrashIcon size={16} strokeWidth={1.8} />}
          accessibleLabel="حذف از سبد"
          title="حذف از سبد خرید"
          body={`«${line.title}» از سبد حذف شود؟ می‌توانید به‌جای حذف، آن را برای بعد ذخیره کنید.`}
          confirm="حذف کالا"
        >
          <input type="hidden" name="line" value={line.id} />
        </ConfirmButton>
      </div>

      {!line.orderable ? (
        <p className="zn-cline__stock zn-cline__stock--gone">
          این کالا در حال حاضر به این تعداد موجود نیست
        </p>
      ) : line.stockRemaining <= LOW_STOCK_AT ? (
        <p className="zn-cline__stock">{lowStockNote(line.stockRemaining)}</p>
      ) : null}
    </article>
  );
}
