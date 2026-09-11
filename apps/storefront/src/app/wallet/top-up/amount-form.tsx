'use client';

import { TOP_UP_QUICK_RIALS, type PaymentMethod } from '@sharghigold/contracts';
import { useActionState, useState } from 'react';

import { CardIcon, TransferIcon } from '@/components/icons';
import {
  AMOUNT_RANGE_HINT,
  METHOD_ORDER,
  PAYMENT_METHODS,
  toman,
  tomanField,
  tomanWords,
} from '@/lib/wallet-view';

import { startPayment } from './actions';
import { EMPTY_TOP_UP_STATE, type TopUpState } from './state';

interface AmountFormProps {
  readonly balanceRials: string;
  /** Development only: the control that stages an ending at the bank. */
  readonly canSimulate: boolean;
}

/** Grouped Persian digits back to the Latin ones the field submits. */
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

function latin(value: string): string {
  let out = '';
  for (const character of value) {
    const digit = PERSIAN.indexOf(character);
    if (digit >= 0) out += String(digit);
    else if (character >= '0' && character <= '9') out += character;
  }
  return out;
}

function methodIcon(method: PaymentMethod) {
  return method === 'gateway' ? <CardIcon size={19} /> : <TransferIcon size={19} />;
}

/**
 * The amount, the method, and what the two of them come to.
 *
 * The figure is held here as Latin digits and shown grouped in Persian ones,
 * so the field reads the way the shop quotes prices while the value that
 * travels is unambiguous. Everything the summary shows is derived from that
 * one string, and nothing below it is a price the server will trust: the
 * amount is re-read, re-converted and re-checked in the action.
 *
 * The quick amounts are the contract's, in rials, so the chips and the limits
 * cannot drift apart.
 */
export function AmountForm({ balanceRials, canSimulate }: AmountFormProps) {
  const [state, submit, pending] = useActionState<TopUpState, FormData>(
    startPayment,
    EMPTY_TOP_UP_STATE,
  );

  const [typed, setTyped] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('gateway');

  const digits = typed === '' ? '0' : typed;
  const amountRials = BigInt(digits) * 10n;
  const enough = amountRials >= 500_000n;
  const balance = BigInt(balanceRials);

  const message = state.status === 'invalid' ? state.message : undefined;
  const words = tomanWords(String(amountRials));
  const helper = words === '' ? AMOUNT_RANGE_HINT : words;

  return (
    <form className="zn-topup__form" action={submit}>
      <input type="hidden" name="toman" value={typed} />
      <input type="hidden" name="method" value={method} />

      <section className="zn-topup__step" aria-labelledby="zn-topup-1">
        <h2 className="zn-topup__head" id="zn-topup-1">
          <span className="zn-topup__num" aria-hidden="true">
            ۱
          </span>
          چه مبلغی اضافه می‌کنید؟
        </h2>

        <div className="zn-field zn-price-input">
          <label className="sr-only" htmlFor="zn-amount">
            مبلغ افزایش موجودی به تومان
          </label>
          <div className="zn-inputwrap">
            <input
              className="zn-input zn-input--lg zn-input--hasend"
              id="zn-amount"
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              value={typed === '' ? '' : tomanField(String(amountRials))}
              onChange={(event) => setTyped(latin(event.target.value).slice(0, 12))}
              aria-invalid={message === undefined ? undefined : true}
              aria-describedby="zn-amount-help"
            />
            <span className="zn-field__adorn zn-field__adorn--end zn-price-input__unit">تومان</span>
          </div>
          {message === undefined ? (
            <span className="zn-field__msg zn-field__msg--help" id="zn-amount-help">
              {helper}
            </span>
          ) : (
            <span className="zn-field__msg zn-field__msg--error" id="zn-amount-help" role="alert">
              {message}
            </span>
          )}
        </div>

        <fieldset className="zn-quick">
          <legend className="sr-only">مبلغ‌های پیشنهادی</legend>
          {TOP_UP_QUICK_RIALS.map((rials) => {
            const value = String(rials / 10n);
            return (
              <label className="zn-quick__option" key={value}>
                <input
                  className="zn-quick__input"
                  type="radio"
                  name="quick"
                  value={value}
                  checked={typed === value}
                  onChange={() => setTyped(value)}
                />
                <span className="zn-quick__chip">{tomanWords(String(rials))}</span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <section className="zn-topup__step" aria-labelledby="zn-topup-2">
        <h2 className="zn-topup__head" id="zn-topup-2">
          <span className="zn-topup__num" aria-hidden="true">
            ۲
          </span>
          چطور پرداخت می‌کنید؟
        </h2>

        <fieldset className="zn-methods">
          <legend className="sr-only">روش پرداخت</legend>
          {METHOD_ORDER.map((key) => {
            const copy = PAYMENT_METHODS[key];
            const on = method === key;

            return (
              <label
                className={`zn-method${on ? ' zn-method--on' : ''}${copy.available ? '' : ' zn-method--off'}`}
                key={key}
              >
                <input
                  className="zn-method__input"
                  type="radio"
                  name="methodChoice"
                  value={key}
                  checked={on}
                  disabled={!copy.available}
                  onChange={() => setMethod(key)}
                />
                <span className="zn-method__icon" aria-hidden="true">
                  {methodIcon(key)}
                </span>
                <span className="zn-method__text">
                  <span className="zn-method__label">{copy.label}</span>
                  <span className="zn-method__note">{copy.note}</span>
                </span>
                <span className="zn-method__dot" aria-hidden="true" />
              </label>
            );
          })}
        </fieldset>
      </section>

      <section className="zn-topup__step" aria-labelledby="zn-topup-3">
        <h2 className="zn-topup__head" id="zn-topup-3">
          <span className="zn-topup__num" aria-hidden="true">
            ۳
          </span>
          بازبینی و پرداخت
        </h2>

        <dl className={`zn-review${enough ? '' : ' zn-review--empty'}`}>
          <div className="zn-review__row">
            <dt className="zn-review__key">مبلغ پرداخت</dt>
            <dd className="zn-review__value">
              {enough ? toman(String(amountRials)) : '—'}
              <span className="zn-review__unit">تومان</span>
            </dd>
          </div>
          <div className="zn-review__row">
            <dt className="zn-review__key">موجودی پس از پرداخت</dt>
            <dd className="zn-review__value">
              {enough ? toman(String(balance + amountRials)) : '—'}
              <span className="zn-review__unit">تومان</span>
            </dd>
          </div>
        </dl>
      </section>

      {canSimulate ? (
        <div className="zn-topup__stage">
          <label className="zn-topup__stagelabel" htmlFor="zn-simulate">
            نتیجه‌ای که درگاه آزمایشی برمی‌گرداند
          </label>
          <select className="zn-topup__stageselect" id="zn-simulate" name="simulate">
            <option value="succeeded">پرداخت موفق</option>
            <option value="failed">پرداخت ناموفق</option>
            <option value="canceled">لغو در درگاه</option>
            <option value="pending">در انتظار پاسخ بانک</option>
          </select>
        </div>
      ) : null}

      <p className="zn-topup__safe">
        <LockGlyph />
        <span>
          پرداخت در درگاه امن بانکی انجام می‌شود و اطلاعات کارت شما نزد زرنما ذخیره نمی‌شود.
        </span>
      </p>

      <div className="zn-topup__foot">
        <button className="zn-topup__pay" type="submit" disabled={!enough || pending}>
          {payLabel(pending, enough, amountRials)}
        </button>
        <p className="zn-topup__hint" role="status">
          {state.status === 'unavailable'
            ? 'پرداخت آنلاین در این محیط در دسترس نیست.'
            : enough
              ? 'به درگاه امن بانکی منتقل می‌شوید'
              : 'برای ادامه، مبلغ را وارد کنید'}
        </p>
      </div>
    </form>
  );
}

function payLabel(pending: boolean, enough: boolean, amountRials: bigint): string {
  if (pending) return 'در حال انتقال…';
  return enough ? `پرداخت ${toman(String(amountRials))} تومان` : 'پرداخت و افزایش موجودی';
}

function LockGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4.4" y="10.4" width="15.2" height="10.2" rx="2.2" />
      <path d="M8.2 10.4V7.2a3.8 3.8 0 0 1 7.6 0v3.2" />
    </svg>
  );
}
