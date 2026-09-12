import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHead } from '@/components/account/page-head';
import { CheckoutBar } from '@/components/cart/checkout-bar';
import { ChoiceForm } from '@/components/cart/choice-form';
import { BankCardIcon, ClockIcon, WalletIcon } from '@/components/icons';
import {
  CHECKOUT_STEPS,
  INSTALLMENT_NOTE,
  PAYMENT_COPY,
  PAYMENT_ORDER,
  persianCount,
  toman,
} from '@/lib/cart-view';
import { ACCEPTED_BANKS } from '@/server/policy/checkout-policy';
import { installmentOffers } from '@/server/policy/installments';
import { INSTALLMENT } from '@/server/policy/shop-policy';

import { checkoutContext } from '../lib';
import { continueToReview, pickMonths, pickPayment } from '../actions';

import '../checkout.css';
import '../../cart/cart.css';
import '../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'شیوه پرداخت',
  robots: { index: false, follow: false },
};

const PAY_ICON = {
  gateway: BankCardIcon,
  wallet: WalletIcon,
  installment: ClockIcon,
} as const;

const PROBLEM: Record<string, string> = {
  invoice: 'نام شرکت و شناسه ملی را کامل وارد کنید.',
  'insufficient-funds': 'موجودی کیف پول برای این سفارش کافی نیست.',
};

export default async function PaymentPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { viewer, draft, quote, payNow, months } = await checkoutContext();
  const query = await searchParams;

  const balance = viewer.customer.walletRials;
  const short = quote.total > balance ? quote.total - balance : 0n;
  const offers = installmentOffers(quote.total);
  const chosen = offers.find((offer) => offer.months === months) ?? offers[0];

  const raw = typeof query['problem'] === 'string' ? query['problem'] : undefined;
  const problem = raw === undefined ? undefined : PROBLEM[raw];

  return (
    <div className="zn-shell zn-shell--plain zn-checkout">
      <PageHead title="شیوه پرداخت" back="/checkout/delivery" />

      <div className="zn-checkout__steps">
        <OrderStepper steps={CHECKOUT_STEPS} current={1} label="مراحل ثبت سفارش" />
      </div>

      {problem === undefined ? null : (
        <p className="zn-cart__problem" role="alert">
          {problem}
        </p>
      )}

      {/* The method, and whatever that method needs to say for itself. The
          wallet is offered only when it covers the order: a part-payment split
          across a wallet and a card is two settlements that have to succeed or
          fail together, and that is not built. */}
      <ChoiceForm action={pickPayment} className="zn-methods">
        <fieldset className="zn-methods__set">
          <legend className="sr-only">شیوه پرداخت</legend>

          {PAYMENT_ORDER.map((method) => {
            const Icon = PAY_ICON[method];
            const on = draft.payment === method;
            const blocked = method === 'wallet' && short > 0n;

            return (
              <div className={on ? 'zn-method zn-method--on' : 'zn-method'} key={method}>
                <label className="zn-method__pick">
                  <input
                    className="sr-only"
                    type="radio"
                    name="payment"
                    value={method}
                    defaultChecked={on}
                    disabled={blocked}
                  />
                  <span className="zn-method__dot" aria-hidden="true" />
                  <span className="zn-method__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <span className="zn-method__body">
                    <span className="zn-method__label">{PAYMENT_COPY[method].label}</span>
                    <span
                      className={
                        blocked ? 'zn-method__note zn-method__note--bad' : 'zn-method__note'
                      }
                    >
                      {blocked ? 'موجودی کافی نیست' : PAYMENT_COPY[method].note}
                    </span>
                  </span>
                </label>

                {method === 'wallet' ? (
                  <div className="zn-method__detail">
                    <p className="zn-purseline2">
                      <span className="zn-purseline2__label">موجودی کیف پول</span>
                      <span className="zn-purseline2__figure">
                        {toman(balance.toString())} تومان
                      </span>
                    </p>

                    {short > 0n ? (
                      <p className="zn-method__short">
                        موجودی برای این سفارش کافی نیست؛{' '}
                        <b className="zn-method__shortfigure">{toman(short.toString())}</b> تومان
                        کمبود دارید. کیف پول را شارژ کنید یا از درگاه بانکی پرداخت کنید.
                      </p>
                    ) : null}

                    <Link className="zn-method__topup" href="/wallet/top-up">
                      افزایش موجودی کیف پول
                    </Link>
                  </div>
                ) : null}

                {method === 'gateway' && on ? (
                  <ul className="zn-banks">
                    {ACCEPTED_BANKS.map((bank) => (
                      <li className="zn-banks__item" key={bank}>
                        {bank}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </fieldset>
      </ChoiceForm>

      {/* The instalment terms, priced by the same policy the product page
          quotes from, so what checkout takes and what the catalogue advertised
          cannot disagree. */}
      {draft.payment === 'installment' && chosen !== undefined ? (
        <section className="zn-plan" aria-label="مدت بازپرداخت">
          <h2 className="zn-plan__title">مدت بازپرداخت</h2>

          <ChoiceForm action={pickMonths} className="zn-plan__terms">
            <fieldset className="zn-plan__set">
              <legend className="sr-only">مدت بازپرداخت</legend>
              {offers.map((offer) => (
                <label
                  className={offer.months === months ? 'zn-term zn-term--on' : 'zn-term'}
                  key={offer.months}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="months"
                    value={offer.months}
                    defaultChecked={offer.months === months}
                  />
                  {persianCount(offer.months)} ماه
                </label>
              ))}
            </fieldset>
          </ChoiceForm>

          <dl className="zn-plan__rows">
            <div className="zn-plan__row">
              <dt>پیش‌پرداخت ({persianCount(INSTALLMENT.depositBasisPoints / 100)}٪)</dt>
              <dd>{toman(chosen.depositRials)}</dd>
            </div>
            <div className="zn-plan__row">
              <dt>قسط ماهانه</dt>
              <dd className="zn-plan__monthly">{toman(chosen.monthlyRials)}</dd>
            </div>
            <div className="zn-plan__row">
              <dt>جمع بازپرداخت</dt>
              <dd>{toman(chosen.totalRials)}</dd>
            </div>
          </dl>

          <p className="zn-plan__note">{INSTALLMENT_NOTE}</p>
        </section>
      ) : null}

      {/* The invoice fields are saved by the press that continues, for the
          same reason the recipient fields are: they are free text, and text
          stored halfway is text nobody checked. */}
      <form className="zn-invoiceform" action={continueToReview}>
        <section className="zn-invoice">
          <h2 className="zn-invoice__title">نوع فاکتور</h2>

          <fieldset className="zn-invoice__set">
            <legend className="sr-only">نوع فاکتور</legend>

            <label className="zn-term zn-term--wide">
              <input
                className="sr-only zn-invoice__radio"
                type="radio"
                name="invoice"
                value="personal"
                defaultChecked={draft.invoice === 'personal'}
              />
              شخصی
            </label>

            <label className="zn-term zn-term--wide">
              <input
                className="sr-only zn-invoice__radio zn-invoice__radio--official"
                type="radio"
                name="invoice"
                value="official"
                defaultChecked={draft.invoice === 'official'}
              />
              رسمی (حقوقی)
            </label>
          </fieldset>

          <div className="zn-invoice__fields">
            <label className="sr-only" htmlFor="zn-co-name">
              نام شرکت
            </label>
            <input
              className="zn-recipient__field"
              id="zn-co-name"
              name="companyName"
              type="text"
              placeholder="نام شرکت"
              defaultValue={draft.companyName ?? ''}
            />

            <label className="sr-only" htmlFor="zn-co-code">
              شناسه ملی یا کد اقتصادی
            </label>
            <input
              className="zn-recipient__field zn-recipient__field--num"
              id="zn-co-code"
              name="companyCode"
              type="text"
              inputMode="numeric"
              placeholder="شناسه ملی / کد اقتصادی"
              defaultValue={draft.companyCode ?? ''}
            />
          </div>
        </section>

        <CheckoutBar
          action={null}
          label={draft.payment === 'installment' ? 'پیش‌پرداخت' : 'مبلغ قابل پرداخت'}
          amountRials={payNow.toString()}
          cta="بازبینی سفارش"
          hint={PAYMENT_COPY[draft.payment].label}
        />
      </form>
    </div>
  );
}
