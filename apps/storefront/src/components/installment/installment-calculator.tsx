'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { groupThousands, toLatinDigits, toPersianDigits } from '@sharghigold/money';

import { ChevronDownIcon } from '@/components/icons';
import {
  type CalculatorQuote,
  instalmentCountLabel,
  instalmentDueLabel,
  millionsLabel,
  MONTHLY_SURCHARGE_LABEL,
  QUICK_AMOUNTS_TOMAN,
  termSurchargeLabel,
} from '@/lib/installment-view';
import { persianCount, toman } from '@/lib/product-view';
import { routes } from '@/lib/routes';

/** How long typing pauses before the quote is fetched. */
const TYPING_PAUSE_MS = 400;

export interface CalculatorCopy {
  readonly helper: string;
  readonly depositNote: string;
  readonly cta: string;
  readonly ctaNote: string;
}

/**
 * «محاسبه‌گر اقساط».
 *
 * The browser never prices anything. Every figure below the field is the
 * server's, from `quote`; what this island does is choose the address that
 * quote is read from. The quick amounts and the terms are links, the field is
 * a `method="get"` form, and typing replaces the URL once the customer pauses
 * — so the calculator works before hydration, a quote can be shared, and the
 * monthly figure is computed by the same function checkout charges with.
 *
 * The field keeps what was typed while a new quote is on its way; the figures
 * it no longer matches are marked busy rather than recomputed locally.
 */
export function InstallmentCalculator({
  quote,
  terms,
  depositPercent,
  categorySlug,
  shopHref,
  copy,
}: {
  readonly quote: CalculatorQuote;
  readonly terms: readonly number[];
  readonly depositPercent: number;
  /** Carried through every link, so the rail under the calculator keeps its category. */
  readonly categorySlug: string | undefined;
  readonly shopHref: string;
  readonly copy: CalculatorCopy;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [typed, setTyped] = useState(quote.typed);
  // The last amount this island asked the server for, and the last one the
  // server answered with. A quote for an amount somebody has since typed past
  // must not overwrite the field; a quote that arrived by a link must.
  const [requested, setRequested] = useState(quote.typed);
  const [answered, setAnswered] = useState(quote.typed);

  if (answered !== quote.typed) {
    setAnswered(quote.typed);
    if (quote.typed !== requested) setTyped(quote.typed);
  }

  const amount = typed === '' ? quote.typed : typed;
  const hrefFor = (next: { readonly amount?: string; readonly months?: number }) =>
    routes.installment({
      ...(categorySlug === undefined ? {} : { category: categorySlug }),
      amount: next.amount ?? amount,
      months: next.months ?? quote.months,
    });

  const target = hrefFor({});

  useEffect(() => {
    // An empty field is somebody about to type, not a request for the default.
    if (typed === '' || typed === quote.typed) return undefined;

    const timer = setTimeout(() => {
      setRequested(typed);
      startTransition(() => router.replace(target, { scroll: false }));
    }, TYPING_PAUSE_MS);

    return () => clearTimeout(timer);
  }, [typed, quote.typed, target, router]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typed === '') return;
    setRequested(typed);
    startTransition(() => router.replace(target, { scroll: false }));
  };

  const stale = pending || (typed !== '' && typed !== quote.typed);
  const showError = quote.error !== null && typed === quote.typed;

  return (
    <div className="zn-calc">
      <form
        className="zn-calc__form"
        method="get"
        action={routes.installment()}
        onSubmit={onSubmit}
      >
        <label className="zn-calc__step" htmlFor="calc-amount">
          ۱. مبلغ خرید
        </label>
        <div className="zn-field zn-price-input">
          <div className="zn-inputwrap">
            <input
              className="zn-input zn-input--lg zn-input--hasend zn-calc__input"
              id="calc-amount"
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              value={typed === '' ? '' : toPersianDigits(groupThousands(typed, '٬'))}
              onChange={(event) =>
                setTyped(toLatinDigits(event.target.value).replace(/\D/g, '').slice(0, 13))
              }
              aria-invalid={showError || undefined}
              aria-describedby="calc-amount-msg"
            />
            <span className="zn-field__adorn zn-field__adorn--end zn-price-input__unit zn-calc__unit">
              تومان
            </span>
          </div>
          <span
            className={`zn-field__msg ${showError ? 'zn-field__msg--error' : 'zn-field__msg--help'}`}
            id="calc-amount-msg"
            role={showError ? 'alert' : undefined}
          >
            {showError ? quote.error : copy.helper}
          </span>
        </div>
        <input type="hidden" name="months" value={quote.months} />
        {categorySlug === undefined ? null : (
          <input type="hidden" name="category" value={categorySlug} />
        )}
        {/* For the form without JavaScript; Enter submits it with one. */}
        <button className="sr-only" type="submit">
          محاسبه
        </button>
      </form>

      <div className="zn-calc__quick" role="group" aria-label="مبلغ‌های پیشنهادی">
        {QUICK_AMOUNTS_TOMAN.map((value) => {
          const on = amount === value;
          return (
            <Link
              className={`zn-calc__pick${on ? ' zn-calc__pick--on' : ''}`}
              key={value}
              href={hrefFor({ amount: value })}
              replace
              scroll={false}
              aria-current={on ? 'true' : undefined}
            >
              {millionsLabel(value)}
            </Link>
          );
        })}
      </div>

      <span className="zn-calc__step zn-calc__step--gap">۲. پیش‌پرداخت</span>
      <p className="zn-calc__deposit">
        <span className="zn-calc__depositchip">{`${persianCount(depositPercent)}٪`}</span>
        <span className="zn-calc__depositamount">
          {toman(quote.depositRials)}
          <span className="zn-calc__depositunit">تومان</span>
        </span>
      </p>
      <p className="zn-calc__note">{copy.depositNote}</p>
      <span className="zn-calc__step zn-calc__step--gap" id="calc-terms">
        ۳. تعداد اقساط
      </span>
      <div className="zn-calc__terms" role="group" aria-labelledby="calc-terms">
        {terms.map((months) => {
          const on = months === quote.months;
          return (
            <Link
              className={`zn-calc__term${on ? ' zn-calc__term--on' : ''}`}
              key={months}
              href={hrefFor({ months })}
              replace
              scroll={false}
              aria-current={on ? 'true' : undefined}
            >
              <span className="zn-calc__termn">{persianCount(months)}</span>
              <span className="zn-calc__termsub">{termSurchargeLabel(months)}</span>
            </Link>
          );
        })}
      </div>

      <div className="zn-calc__result" aria-busy={stale}>
        <span className="zn-calc__resultlabel">قسط ماهانه شما</span>
        <span className="zn-calc__monthly">
          <output className="zn-calc__monthlyvalue" htmlFor="calc-amount" aria-live="polite">
            {toman(quote.monthlyRials)}
          </output>
          <span className="zn-calc__monthlyunit">تومان / ماه</span>
        </span>

        <dl className="zn-calc__lines">
          <div className="zn-calc__line">
            <dt>{`پیش‌پرداخت (${persianCount(depositPercent)}٪)`}</dt>
            <dd>{toman(quote.depositRials)}</dd>
          </div>
          <div className="zn-calc__line">
            <dt>مبلغ اقساطی</dt>
            <dd>{toman(quote.financedRials)}</dd>
          </div>
          <div className="zn-calc__line">
            <dt>{`کارمزد اقساط (${MONTHLY_SURCHARGE_LABEL})`}</dt>
            <dd>{toman(quote.surchargeRials)}</dd>
          </div>
          <div className="zn-calc__line zn-calc__line--total">
            <dt>مبلغ کل پرداختی</dt>
            <dd>
              {toman(quote.totalRials)}
              <span className="zn-calc__lineunit">تومان</span>
            </dd>
          </div>
        </dl>
      </div>

      <details className="zn-calc__schedule">
        <summary className="zn-calc__schedulehead">
          جدول کامل اقساط
          <span className="zn-calc__schedulecount">
            {instalmentCountLabel(quote.months)}
            <span className="zn-instchev">
              <ChevronDownIcon size={15} strokeWidth={1.9} />
            </span>
          </span>
        </summary>
        <ol className="zn-calc__rows">
          {quote.instalmentRials.map((part, index) => (
            // A schedule row is its position in the term; nothing else names it.
            // oxlint-disable-next-line no-array-index-key
            <li className="zn-calc__row" key={index}>
              <span className="zn-calc__rowi">{persianCount(index + 1)}</span>
              <span className="zn-calc__rowdate">{instalmentDueLabel(index, quote.months)}</span>
              <span className="zn-calc__rowamount">{toman(part)}</span>
            </li>
          ))}
        </ol>
      </details>

      <Link className="zn-calc__cta" href={shopHref}>
        {copy.cta}
      </Link>
      <p className="zn-calc__ctanote">{copy.ctaNote}</p>
    </div>
  );
}
