import type { Metadata } from 'next';
import Link from 'next/link';

import { dropSavedLine, restoreLine } from '@/app/cart/actions';
import { ConfirmButton } from '@/components/account/confirm-button';
import { Flash } from '@/components/account/flash';
import { PageHead } from '@/components/account/page-head';
import { SubmitButton } from '@/components/account/submit-button';
import { BookmarkIcon } from '@/components/icons';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { cartProblem, persianCount, savedCountLabel, toman } from '@/lib/cart-view';
import { requireViewer } from '@/server/account/session';
import { viewCart } from '@/server/cart/cart';

import '../cart.css';
import '../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ذخیره‌شده برای بعد',
  robots: { index: false, follow: false },
};

/**
 * «ذخیره‌شده برای بعد».
 *
 * A saved piece has no quantity and is not being bought, so it carries one
 * price — what one of them costs at today's locked rate — and two controls.
 * The price is recomputed on every render for the same reason every other
 * price here is: a stored figure for a gold piece is a figure that is wrong by
 * tomorrow.
 */
export default async function SavedPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const query = await searchParams;
  const cart = await viewCart(viewer);

  const problem = cartProblem(typeof query['problem'] === 'string' ? query['problem'] : undefined);

  return (
    <div className="zn-shell zn-shell--plain zn-saved">
      <PageHead
        title="ذخیره‌شده برای بعد"
        back="/cart"
        trailing={savedCountLabel(cart.saved.length)}
      />

      <p className="zn-saved__intro">
        قیمت این قطعه‌ها با نرخ روز به‌روز می‌شود. هر زمان خواستید به سبد برگردانید.
      </p>

      <Flash code={typeof query['ok'] === 'string' ? query['ok'] : undefined} />

      {problem === undefined ? null : (
        <p className="zn-cart__problem" role="alert">
          {problem}
        </p>
      )}

      {cart.saved.length === 0 ? (
        <div className="zn-empty">
          <span className="zn-empty__glyph" aria-hidden="true">
            <BookmarkIcon size={27} strokeWidth={1.6} />
          </span>
          <h2 className="zn-empty__title">چیزی ذخیره نکرده‌اید</h2>
          <p className="zn-empty__body">
            هر کالایی را که فعلاً نمی‌خواهید بخرید، از سبد خرید اینجا نگه دارید.
          </p>
        </div>
      ) : (
        <div className="zn-saved__list">
          {cart.saved.map((item) => (
            <article className="zn-sline" key={item.id}>
              <div className="zn-sline__top">
                <Link
                  className="zn-sline__shot"
                  href={`/products/${item.productSlug}`}
                  tabIndex={-1}
                >
                  <MediaPlaceholder label="عکس کالا" />
                </Link>

                <div className="zn-sline__body">
                  <h3 className="zn-sline__title">
                    <Link className="zn-sline__link" href={`/products/${item.productSlug}`}>
                      {item.title}
                    </Link>
                  </h3>
                  <p className="zn-sline__spec">
                    {item.size === null
                      ? `طلای ${item.colourLabel}`
                      : `سایز ${persianCount(item.size)} · طلای ${item.colourLabel}`}
                  </p>
                  <p className="zn-sline__price">
                    <span className="zn-sline__figure">{toman(item.unitTotalRials)}</span>
                    <span className="zn-sline__unit">تومان</span>
                  </p>
                </div>
              </div>

              <div className="zn-sline__tools">
                <form className="zn-sline__restore-form" action={restoreLine}>
                  <input type="hidden" name="line" value={item.id} />
                  <SubmitButton
                    className="zn-sline__restore"
                    pendingLabel="…"
                    disabled={!item.orderable}
                  >
                    {item.orderable ? 'بازگشت به سبد' : 'فعلاً موجود نیست'}
                  </SubmitButton>
                </form>

                <ConfirmButton
                  action={dropSavedLine}
                  className="zn-sline__drop"
                  label="حذف"
                  title="حذف از ذخیره‌شده‌ها"
                  body={`«${item.title}» از فهرست ذخیره‌شده‌ها حذف شود؟`}
                  confirm="حذف"
                >
                  <input type="hidden" name="line" value={item.id} />
                </ConfirmButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
