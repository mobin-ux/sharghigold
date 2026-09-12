import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHead } from '@/components/account/page-head';
import { CheckoutBar } from '@/components/cart/checkout-bar';
import { ChoiceForm } from '@/components/cart/choice-form';
import { DeliveryIcon, PlusIcon, StoreIcon } from '@/components/icons';
import { CHECKOUT_STEPS, feeLabel, PICKUP_NOTE, slotLabel, toman } from '@/lib/cart-view';
import { toPersianDigits } from '@sharghigold/money';
import { getAddresses } from '@/server/account/account';
import { chosenAddress, chosenBranch, chosenShipping } from '@/server/checkout/draft';
import {
  BRANCHES,
  collectionSlots,
  GIFT_WRAP,
  SHIPPING_CHOICES,
  shippingCost,
} from '@/server/policy/checkout-policy';

import { checkoutContext } from '../lib';
import {
  continueToPayment,
  pickAddress,
  pickBranch,
  pickMode,
  pickShipping,
  pickSlot,
  toggleGift,
} from '../actions';

import '../checkout.css';
import '../../cart/cart.css';
import '../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'شیوه دریافت',
  robots: { index: false, follow: false },
};

/** What an address's own label is called, for the card and its spoken name. */
const ADDRESS_LABEL = { home: 'خانه', work: 'محل کار', other: 'دیگر' } as const;

const PROBLEM: Record<string, string> = {
  recipient: 'نام و شماره گیرنده را کامل کنید.',
  'no-address': 'یک آدرس تحویل انتخاب کنید.',
  'no-slot': 'زمان مراجعه را انتخاب کنید.',
  'recipient-incomplete': 'نام و شماره گیرنده را کامل کنید.',
  'courier-outside-tehran': 'پیک اختصاصی تنها برای نشانی‌های تهران در دسترس است.',
};

export default async function DeliveryPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { viewer, draft, quote, payNow, now } = await checkoutContext();
  const query = await searchParams;

  const addresses = getAddresses(viewer);
  const address = chosenAddress(viewer, draft);
  const shipping = chosenShipping(draft);
  const branch = chosenBranch(draft);
  const slots = collectionSlots(branch, now);
  const today = new Date(now.getTime() + 210 * 60_000).toISOString().slice(0, 10);

  const raw = typeof query['problem'] === 'string' ? query['problem'] : undefined;
  const problem = raw === undefined ? undefined : PROBLEM[raw];
  const shipChoice = SHIPPING_CHOICES.find((choice) => choice.method === shipping);
  const booked = slots.find((slot) => slot.id === draft.slotId);

  const hint =
    draft.mode === 'pickup'
      ? booked === undefined
        ? 'زمان مراجعه را انتخاب کنید'
        : `زمان مراجعه: ${slotLabel(booked, today)}`
      : shipChoice?.note;

  return (
    <div className="zn-shell zn-shell--plain zn-checkout">
      <PageHead title="شیوه دریافت" back="/cart" />

      <div className="zn-checkout__steps">
        <OrderStepper steps={CHECKOUT_STEPS} current={0} label="مراحل ثبت سفارش" />
      </div>

      {problem === undefined ? null : (
        <p className="zn-cart__problem" role="alert">
          {problem}
        </p>
      )}

      {/* Delivery or collection. A radio group rather than two buttons with
          `aria-pressed`: picking one has to unpick the other, which is what a
          radio group is for and what the arrow keys already do. */}
      <ChoiceForm action={pickMode} className="zn-modes">
        <fieldset className="zn-modes__set">
          <legend className="sr-only">شیوه دریافت سفارش</legend>

          <label className={draft.mode === 'ship' ? 'zn-mode zn-mode--on' : 'zn-mode'}>
            <input
              className="sr-only"
              type="radio"
              name="mode"
              value="ship"
              defaultChecked={draft.mode === 'ship'}
            />
            <DeliveryIcon size={17} strokeWidth={1.7} />
            ارسال به آدرس
          </label>

          <label className={draft.mode === 'pickup' ? 'zn-mode zn-mode--on' : 'zn-mode'}>
            <input
              className="sr-only"
              type="radio"
              name="mode"
              value="pickup"
              defaultChecked={draft.mode === 'pickup'}
            />
            <StoreIcon size={17} strokeWidth={1.7} />
            تحویل در شعبه
          </label>
        </fieldset>
      </ChoiceForm>

      {draft.mode === 'ship' ? (
        <>
          <h2 className="zn-checkout__title">آدرس تحویل</h2>

          {addresses.length === 0 ? (
            <p className="zn-checkout__none">
              هنوز آدرسی ثبت نکرده‌اید. برای ادامه، یک نشانی اضافه کنید.
            </p>
          ) : (
            <ChoiceForm action={pickAddress} className="zn-picks">
              <fieldset className="zn-picks__set">
                <legend className="sr-only">آدرس تحویل</legend>
                {addresses.map((entry) => (
                  <label
                    className={entry.id === address?.id ? 'zn-pick zn-pick--on' : 'zn-pick'}
                    key={entry.id}
                    aria-label={`${ADDRESS_LABEL[entry.label]}: ${entry.city}، ${entry.line}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="address"
                      value={entry.id}
                      defaultChecked={entry.id === address?.id}
                    />
                    <span className="zn-pick__dot" aria-hidden="true" />
                    <span className="zn-pick__body">
                      <span className="zn-pick__row">
                        <span className="zn-pick__title">{ADDRESS_LABEL[entry.label]}</span>
                        {entry.isDefault ? <span className="zn-pick__badge">پیش‌فرض</span> : null}
                      </span>
                      <span className="zn-pick__line">
                        {entry.province}، {entry.city}، {entry.line}، پلاک {entry.plate}
                        {entry.unit === null ? '' : `، واحد ${entry.unit}`}
                      </span>
                      <span className="zn-pick__meta">
                        {toPersianDigits(entry.recipientMobile)}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </ChoiceForm>
          )}

          <Link className="zn-checkout__add" href="/account/addresses/new">
            <PlusIcon size={16} strokeWidth={1.9} />
            افزودن آدرس جدید
          </Link>

          <h2 className="zn-checkout__title">روش ارسال</h2>
          <ChoiceForm action={pickShipping} className="zn-picks">
            <fieldset className="zn-picks__set">
              <legend className="sr-only">روش ارسال</legend>
              {SHIPPING_CHOICES.map((choice) => (
                <label
                  className={`zn-pick zn-pick--compact${choice.method === shipping ? ' zn-pick--on' : ''}`}
                  key={choice.method}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="shipping"
                    value={choice.method}
                    defaultChecked={choice.method === shipping}
                  />
                  <span className="zn-pick__dot" aria-hidden="true" />
                  <span className="zn-pick__body">
                    <span className="zn-pick__title">{choice.title}</span>
                    <span className="zn-pick__note">{choice.note}</span>
                  </span>
                  <span
                    className={
                      shippingCost(choice, quote.total) === 0n
                        ? 'zn-pick__cost zn-pick__cost--free'
                        : 'zn-pick__cost'
                    }
                  >
                    {feeLabel(shippingCost(choice, quote.total).toString())}
                  </span>
                </label>
              ))}
            </fieldset>
          </ChoiceForm>
        </>
      ) : (
        <>
          <h2 className="zn-checkout__title">انتخاب شعبه</h2>
          <ChoiceForm action={pickBranch} className="zn-picks">
            <fieldset className="zn-picks__set">
              <legend className="sr-only">شعبه</legend>
              {BRANCHES.map((entry) => (
                <label
                  className={entry.id === branch.id ? 'zn-pick zn-pick--on' : 'zn-pick'}
                  key={entry.id}
                  aria-label={entry.title}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="branch"
                    value={entry.id}
                    defaultChecked={entry.id === branch.id}
                  />
                  <span className="zn-pick__dot" aria-hidden="true" />
                  <span className="zn-pick__body">
                    <span className="zn-pick__title">{entry.title}</span>
                    <span className="zn-pick__line">{entry.line}</span>
                    <span className="zn-pick__meta">{entry.hours}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </ChoiceForm>

          <h2 className="zn-checkout__title">زمان مراجعه</h2>
          {slots.length === 0 ? (
            <p className="zn-checkout__none">این شعبه در روزهای پیش‌رو زمان خالی ندارد.</p>
          ) : (
            <ChoiceForm action={pickSlot} className="zn-slots">
              <fieldset className="zn-slots__set">
                <legend className="sr-only">زمان مراجعه</legend>
                {slots.map((slot) => (
                  <label
                    className={slot.id === draft.slotId ? 'zn-slot zn-slot--on' : 'zn-slot'}
                    key={slot.id}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="slot"
                      value={slot.id}
                      defaultChecked={slot.id === draft.slotId}
                    />
                    {slotLabel(slot, today)}
                  </label>
                ))}
              </fieldset>
            </ChoiceForm>
          )}

          <p className="zn-checkout__note">{PICKUP_NOTE}</p>
        </>
      )}

      {/* Wrapping changes the total, so the switch is a submit and the figure
          beside it is recomputed by the render that follows. */}
      <section className="zn-extras zn-extras--open" aria-label="افزودنی‌ها">
        <form className="zn-swrow" action={toggleGift}>
          <span className="zn-swrow__text">
            <span className="zn-swrow__title">{GIFT_WRAP.title}</span>
            <span className="zn-swrow__note">{GIFT_WRAP.note}</span>
          </span>
          <span className="zn-swrow__price">{toman(GIFT_WRAP.costRials.toString())}</span>
          <button
            className={draft.gift ? 'zn-swrow__switch zn-swrow__switch--on' : 'zn-swrow__switch'}
            type="submit"
            name="gift"
            value={draft.gift ? 'off' : 'on'}
            role="switch"
            aria-checked={draft.gift}
            aria-label={GIFT_WRAP.title}
          >
            <span className="zn-swrow__knob" aria-hidden="true" />
          </button>
        </form>
      </section>

      {/* The only free-text on this screen, saved by the press that continues.
          The reveal is a real checkbox and a CSS `:has()` rule, so the fields
          appear without a round trip and still post with the form. */}
      <form className="zn-deliverform" action={continueToPayment}>
        <section className="zn-extras zn-extras--tight">
          <label className="zn-swrow zn-swrow--check" aria-label="گیرنده شخص دیگری است">
            <span className="zn-swrow__text">
              <span className="zn-swrow__title">گیرنده شخص دیگری است</span>
              <span className="zn-swrow__note">نام و شماره گیرنده را جداگانه وارد کنید</span>
            </span>
            <input
              className="zn-swrow__box"
              type="checkbox"
              name="other"
              value="on"
              defaultChecked={draft.recipientName !== null}
            />
            <span className="zn-swrow__switch zn-swrow__switch--css" aria-hidden="true">
              <span className="zn-swrow__knob" />
            </span>
          </label>

          <div className="zn-recipient">
            <label className="sr-only" htmlFor="zn-rcv-name">
              نام و نام خانوادگی گیرنده
            </label>
            <input
              className="zn-recipient__field"
              id="zn-rcv-name"
              name="recipientName"
              type="text"
              autoComplete="name"
              placeholder="نام و نام خانوادگی گیرنده"
              defaultValue={draft.recipientName ?? ''}
            />

            <label className="sr-only" htmlFor="zn-rcv-tel">
              شماره موبایل گیرنده
            </label>
            <input
              className="zn-recipient__field zn-recipient__field--num"
              id="zn-rcv-tel"
              name="recipientMobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="شماره موبایل گیرنده"
              defaultValue={draft.recipientMobile ?? ''}
            />
          </div>
        </section>

        <section className="zn-notes">
          <label className="zn-notes__label" htmlFor="zn-notes">
            یادداشت برای زرنما
          </label>
          <textarea
            className="zn-notes__field"
            id="zn-notes"
            name="notes"
            rows={3}
            maxLength={400}
            placeholder="مثلاً: پیش از ارسال تماس بگیرید."
            defaultValue={draft.notes}
          />
        </section>

        <CheckoutBar
          action={null}
          label={draft.mode === 'pickup' ? 'تحویل حضوری' : 'با ارسال'}
          amountRials={payNow.toString()}
          cta="ادامه به پرداخت"
          hint={hint}
        />
      </form>
    </div>
  );
}
