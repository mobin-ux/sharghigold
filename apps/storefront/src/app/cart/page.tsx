import type { Metadata } from 'next';
import Link from 'next/link';

import { Flash } from '@/components/account/flash';
import { PageHead } from '@/components/account/page-head';
import { BillPanel } from '@/components/cart/bill-panel';
import { CheckoutBar } from '@/components/cart/checkout-bar';
import { CodeForm } from '@/components/cart/code-form';
import { CartLineCard } from '@/components/cart/line-card';
import { PriceLock } from '@/components/cart/price-lock';
import {
  ArrowIcon,
  BookmarkIcon,
  CartIcon,
  InvoiceIcon,
  RefreshIcon,
  ShieldIcon,
  TruckIcon,
  WarningIcon,
} from '@/components/icons';
import {
  cartProblem,
  countLabel,
  savedCountLabel,
  TAX_NOTE,
  toman,
  TRUST_POINTS,
} from '@/lib/cart-view';
import { requireViewer } from '@/server/account/session';
import { viewCart } from '@/server/cart/cart';
import { routes } from '@/lib/routes';

import { refreshPrices, removeDiscount, startCheckout } from './actions';

import './cart.css';
import '../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'سبد خرید',
  robots: { index: false, follow: false },
};

const TRUST_ICON = {
  invoice: InvoiceIcon,
  shield: ShieldIcon,
  truck: TruckIcon,
} as const;

export default async function CartPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const query = await searchParams;
  const cart = await viewCart(viewer);

  const problem = cartProblem(typeof query['problem'] === 'string' ? query['problem'] : undefined);
  const expired = cart.secondsRemaining === 0;
  const empty = cart.lines.length === 0;
  const blocked = cart.lines.some((line) => !line.orderable);

  return (
    <div className="zn-shell zn-shell--plain zn-cart">
      <PageHead title="سبد خرید" back="/" trailing={countLabel(cart.itemCount)} />

      {/* The rate this basket is priced against, and how long it is held for.
          Both are the server's: the countdown resumes from the basket's own
          lock rather than restarting whenever the page is opened. */}
      <section className="zn-rate" aria-label="نرخ طلا">
        <div className="zn-rate__row">
          <span className="zn-rate__dot" aria-hidden="true" />
          <span className="zn-rate__name">نرخ طلای ۱۸ عیار</span>
          <span className="zn-rate__price">
            <span className="zn-rate__figure">{toman(cart.pricePerGramRials)}</span>
            <span className="zn-rate__unit">تومان / گرم</span>
          </span>
        </div>
        <div className="zn-rate__lock">
          <PriceLock secondsRemaining={cart.secondsRemaining} />
          <span className="zn-rate__note">قیمت‌ها تا پایان این مهلت برای شما ثابت است</span>
        </div>
      </section>

      <Flash code={typeof query['ok'] === 'string' ? query['ok'] : undefined} />

      {problem === undefined ? null : (
        <p className="zn-cart__problem" role="alert">
          {problem}
        </p>
      )}

      {expired && !empty ? (
        <section className="zn-stale" aria-label="مهلت قیمت">
          <div className="zn-stale__head">
            <span className="zn-stale__icon" aria-hidden="true">
              <WarningIcon size={18} strokeWidth={1.8} />
            </span>
            <span className="zn-stale__text">
              <strong className="zn-stale__title">مهلت قیمت به پایان رسید</strong>
              <span className="zn-stale__body">
                برای ادامه سفارش، قیمت‌ها را با نرخ لحظه بازار به‌روزرسانی کنید.
              </span>
            </span>
          </div>
          <form action={refreshPrices}>
            <button className="zn-stale__go" type="submit">
              <RefreshIcon size={16} strokeWidth={1.9} />
              به‌روزرسانی قیمت‌ها
            </button>
          </form>
        </section>
      ) : null}

      {empty ? (
        <div className="zn-empty">
          <span className="zn-empty__glyph" aria-hidden="true">
            <CartIcon size={30} strokeWidth={1.6} />
          </span>
          <h2 className="zn-empty__title">سبد خرید شما خالی است</h2>
          <p className="zn-empty__body">
            قطعه‌ای را که می‌پسندید انتخاب کنید؛ قیمت هر کالا با نرخ لحظه‌ای طلا محاسبه می‌شود.
          </p>
          <Link className="zn-empty__cta" href={routes.categories()}>
            مشاهده دسته‌بندی‌ها
          </Link>
        </div>
      ) : (
        <>
          <h2 className="zn-cart__heading">
            <span className="zn-cart__headingtext">کالاهای سبد</span>
            <span className="zn-cart__rule" aria-hidden="true" />
            <span className="zn-cart__headingcount">{countLabel(cart.itemCount)}</span>
          </h2>

          <div className="zn-cart__lines">
            {cart.lines.map((line) => (
              <CartLineCard key={line.id} line={line} />
            ))}
          </div>

          <CodeForm
            appliedLabel={cart.discount?.label ?? null}
            appliedCode={cart.discount?.code ?? null}
            onRemove={removeDiscount}
          />
        </>
      )}

      {cart.saved.length === 0 ? null : (
        <Link className="zn-savedlink" href={routes.cartSaved()}>
          <span className="zn-savedlink__icon" aria-hidden="true">
            <BookmarkIcon size={18} strokeWidth={1.8} />
          </span>
          <span className="zn-savedlink__text">
            <span className="zn-savedlink__title">ذخیره‌شده برای بعد</span>
            <span className="zn-savedlink__count">{savedCountLabel(cart.saved.length)}</span>
          </span>
          <ArrowIcon size={18} strokeWidth={1.9} />
        </Link>
      )}

      {empty ? null : (
        <>
          <BillPanel totals={cart.totals} note={TAX_NOTE} />

          <ul className="zn-trust">
            {TRUST_POINTS.map((point) => {
              const Icon = TRUST_ICON[point.icon];
              return (
                <li className="zn-trust__item" key={point.icon}>
                  <span className="zn-trust__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <span className="zn-trust__label">{point.label}</span>
                </li>
              );
            })}
          </ul>

          <CheckoutBar
            action={startCheckout}
            label="مبلغ قابل پرداخت"
            amountRials={cart.totals.payNowRials}
            cta="ادامه ثبت سفارش"
            hint={
              expired
                ? 'قیمت‌ها منقضی شده‌اند.'
                : blocked
                  ? 'یکی از کالاها به این تعداد موجود نیست.'
                  : undefined
            }
            disabled={expired || blocked}
          />
        </>
      )}
    </div>
  );
}
