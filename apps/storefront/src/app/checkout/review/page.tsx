import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHead } from '@/components/account/page-head';
import { BillPanel } from '@/components/cart/bill-panel';
import { CheckoutBar } from '@/components/cart/checkout-bar';
import { PriceLock } from '@/components/cart/price-lock';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { CHECKOUT_STEPS, PAYMENT_COPY, persianCount, slotLabel, toman } from '@/lib/cart-view';
import { cartTotals, deliveryLine } from '@/server/cart/pricing';
import { chosenAddress, chosenBranch, chosenShipping, chosenSlot } from '@/server/checkout/draft';
import { issueIntent } from '@/server/checkout/draft';
import { findShippingChoice, GIFT_WRAP } from '@/server/policy/checkout-policy';
import { paymentsAvailable } from '@/server/wallet/psp';

import { checkoutContext } from '../lib';
import { payAndPlace, pickSimulated, setTerms } from '../actions';

import '../checkout.css';
import '../../cart/cart.css';
import '../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'بازبینی و پرداخت',
  robots: { index: false, follow: false },
};

const PROBLEM: Record<string, string> = {
  'terms-required': 'برای ادامه، قوانین خرید را بپذیرید.',
  'lock-expired': 'مهلت قیمت به پایان رسیده است؛ به سبد برگردید و قیمت‌ها را به‌روزرسانی کنید.',
  'delivery-incomplete': 'اطلاعات دریافت سفارش کامل نیست.',
  'payment-incomplete': 'اطلاعات فاکتور رسمی را کامل کنید.',
  'method-unavailable': 'پرداخت آنلاین در این محیط در دسترس نیست.',
  'stale-intent': 'این صفحه تازه نیست؛ سفارش را دوباره بازبینی کنید.',
  'empty-basket': 'سبد خرید شما خالی است.',
  throttled: 'تعداد تلاش‌ها بیش از حد مجاز بود. کمی بعد دوباره تلاش کنید.',
};

const SIMULATED = [
  { value: '', label: 'پرداخت موفق (پیش‌فرض)' },
  { value: 'failed', label: 'پرداخت ناموفق' },
  { value: 'canceled', label: 'انصراف در درگاه' },
] as const;

export default async function ReviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { viewer, draft, cart, quote, payNow, months, secondsRemaining, now } =
    await checkoutContext();
  const query = await searchParams;

  const address = chosenAddress(viewer, draft);
  const branch = chosenBranch(draft);
  const slot = chosenSlot(draft, now);
  const shipping = findShippingChoice(chosenShipping(draft));
  const today = new Date(now.getTime() + 210 * 60_000).toISOString().slice(0, 10);

  const totals = cartTotals(quote, payNow, deliveryLine(quote, draft.mode));

  // A fresh token for this render. Only the order that was reviewed here can
  // be placed, and a second press of the same button finds it already spent.
  const intent = issueIntent(viewer, now);

  const raw = typeof query['problem'] === 'string' ? query['problem'] : undefined;
  const problem = raw === undefined ? undefined : PROBLEM[raw];
  const accepted = draft.termsAcceptedAt !== null;

  const cards = [
    draft.mode === 'ship'
      ? {
          title: 'آدرس تحویل',
          body:
            address === undefined
              ? 'انتخاب نشده'
              : `${address.province}، ${address.city}، ${address.line}، پلاک ${address.plate}`,
          meta:
            draft.recipientName === null
              ? (address?.recipientMobile ?? '')
              : `گیرنده: ${draft.recipientName} · ${draft.recipientMobile ?? ''}`,
          href: '/checkout/delivery',
        }
      : {
          title: 'تحویل حضوری',
          body: `${branch.title} — ${branch.line}`,
          meta:
            slot === undefined
              ? 'زمان مراجعه انتخاب نشده'
              : `زمان مراجعه: ${slotLabel(slot, today)}`,
          href: '/checkout/delivery',
        },
    draft.mode === 'ship'
      ? {
          title: 'روش ارسال',
          body: shipping?.title ?? 'ارسال',
          meta: shipping?.note ?? '',
          href: '/checkout/delivery',
        }
      : {
          title: 'همراه داشته باشید',
          body: 'کارت ملی یا شناسنامه سفارش‌دهنده',
          meta: 'کالا در حضور شما وزن‌کشی می‌شود',
          href: '/checkout/delivery',
        },
    {
      title: 'روش پرداخت',
      body:
        draft.payment === 'installment'
          ? `${PAYMENT_COPY.installment.label} ${persianCount(months)} ماهه`
          : PAYMENT_COPY[draft.payment].label,
      meta:
        draft.invoice === 'official'
          ? `فاکتور رسمی به نام ${draft.companyName ?? 'شرکت ثبت‌شده'}`
          : 'فاکتور شخصی',
      href: '/checkout/payment',
    },
    draft.gift
      ? {
          title: GIFT_WRAP.title,
          body: GIFT_WRAP.note,
          meta: `${toman(GIFT_WRAP.costRials.toString())} تومان`,
          href: '/checkout/delivery',
        }
      : undefined,
    draft.notes === ''
      ? undefined
      : { title: 'یادداشت شما', body: draft.notes, meta: '', href: '/checkout/delivery' },
  ].filter((card): card is NonNullable<typeof card> => card !== undefined);

  return (
    <div className="zn-shell zn-shell--plain zn-checkout">
      <PageHead title="بازبینی و پرداخت" back="/checkout/payment" />

      <div className="zn-checkout__steps">
        <OrderStepper steps={CHECKOUT_STEPS} current={2} label="مراحل ثبت سفارش" />
      </div>

      {problem === undefined ? null : (
        <p className="zn-cart__problem" role="alert">
          {problem}
        </p>
      )}

      <div className="zn-lockbar">
        <PriceLock secondsRemaining={secondsRemaining} />
        <span className="zn-lockbar__rate">
          {toman(cart.ratePerGramRials.toString())} تومان / گرم
        </span>
      </div>

      <section className="zn-orderlines" aria-label="کالاهای سفارش">
        <h2 className="zn-orderlines__head">
          <span>کالاهای سفارش</span>
          <span className="zn-cart__rule" aria-hidden="true" />
          <span className="zn-orderlines__count">
            {persianCount(quote.lines.reduce((total, line) => total + line.quantity, 0))} قطعه
          </span>
        </h2>

        {quote.lines.map((line) => (
          <div className="zn-oline" key={line.record.id}>
            <span className="zn-oline__shot">
              <MediaPlaceholder label="عکس" />
            </span>
            <span className="zn-oline__body">
              <span className="zn-oline__title">{line.product.title}</span>
              <span className="zn-oline__qty">تعداد {persianCount(line.quantity)}</span>
            </span>
            <span className="zn-oline__price">
              <span className="zn-oline__figure">{toman(line.breakdown.total.toString())}</span>
              <span className="zn-oline__unit">تومان</span>
            </span>
          </div>
        ))}
      </section>

      <div className="zn-cards">
        {cards.map((card) => (
          <section className="zn-card" key={card.title}>
            <h3 className="zn-card__head">
              <span className="zn-card__title">{card.title}</span>
              <Link className="zn-card__edit" href={card.href}>
                ویرایش
              </Link>
            </h3>
            <p className="zn-card__body">{card.body}</p>
            {card.meta === '' ? null : <p className="zn-card__meta">{card.meta}</p>}
          </section>
        ))}
      </div>

      <BillPanel
        totals={totals}
        title="صورت‌حساب نهایی"
        payLabel={draft.payment === 'installment' ? 'پیش‌پرداخت اکنون' : 'مبلغ قابل پرداخت'}
      />

      {/* Accepting the terms is its own submission. Recording it with the
          order would mean recording an acceptance nobody made if the order
          were ever placed another way. */}
      <form className="zn-terms" action={setTerms}>
        <button
          className={accepted ? 'zn-terms__box zn-terms__box--on' : 'zn-terms__box'}
          type="submit"
          name="terms"
          value={accepted ? 'off' : 'on'}
          role="checkbox"
          aria-checked={accepted}
        >
          <span className="zn-terms__tick" aria-hidden="true">
            {accepted ? '✓' : ''}
          </span>
          <span className="zn-terms__text">
            قوانین خرید، شرایط مرجوع کردن و نحوه محاسبه اجرت را خوانده‌ام و می‌پذیرم.
          </span>
        </button>
      </form>

      {paymentsAvailable() && draft.payment !== 'wallet' ? (
        <form className="zn-stage" action={pickSimulated}>
          <label className="zn-stage__label" htmlFor="zn-stage-pick">
            شبیه‌سازی پاسخ درگاه (فقط در محیط توسعه)
          </label>
          <div className="zn-stage__row">
            <select
              className="zn-stage__select"
              id="zn-stage-pick"
              name="simulate"
              defaultValue={draft.simulate ?? ''}
            >
              {SIMULATED.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="zn-stage__go" type="submit">
              اعمال
            </button>
          </div>
        </form>
      ) : null}

      <CheckoutBar
        action={payAndPlace}
        label={draft.payment === 'installment' ? 'پیش‌پرداخت' : 'مبلغ قابل پرداخت'}
        amountRials={payNow.toString()}
        cta="پرداخت و ثبت سفارش"
        hint={
          accepted
            ? 'با زدن این دکمه به درگاه منتقل می‌شوید.'
            : 'برای ادامه، قوانین خرید را بپذیرید.'
        }
        disabled={!accepted}
      >
        <input type="hidden" name="intent" value={intent} />
      </CheckoutBar>
    </div>
  );
}
