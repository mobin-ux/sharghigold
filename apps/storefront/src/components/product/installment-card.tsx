'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import type { InstallmentPlan } from '@sharghigold/contracts';

import { BankCardIcon } from '@/components/icons';
import { persianCount, toman } from '@/lib/product-view';

/**
 * «این انگشتر را قسطی بخرید» — pick a term, see the monthly figure.
 *
 * Every plan arrives with its monthly amount already computed, in whole rials,
 * by the server. This component picks which one to show and nothing else: it
 * never divides a total by a term, because dividing money in the browser is
 * float division and it is how twelve instalments end up not adding to the
 * price (rule 12).
 *
 * A radio group, for the same reason the size picker is one.
 */
export function InstallmentCard({
  plans,
  termsHref,
  noun,
}: {
  readonly plans: readonly InstallmentPlan[];
  /** Carries the category through, so the terms page opens on the right one. */
  readonly termsHref: string;
  /** «انگشتر» — so the heading names the thing rather than saying «کالا». */
  readonly noun: string;
}) {
  const name = useId();
  const [months, setMonths] = useState(() => plans.at(-1)?.months ?? 0);

  const chosen = plans.find((plan) => plan.months === months) ?? plans[0];

  if (chosen === undefined) return null;

  return (
    <section className="zn-instal" aria-label="خرید اقساطی">
      <div className="zn-instal__head">
        <span className="zn-instal__mark">
          <BankCardIcon size={17} strokeWidth={1.8} />
        </span>
        <h2 className="zn-instal__title">این {noun} را قسطی بخرید</h2>
      </div>

      <fieldset className="zn-instal__terms">
        <legend className="sr-only">مدت بازپرداخت</legend>
        {plans.map((plan) => (
          <label
            className={`zn-instal__term${plan.months === months ? ' zn-instal__term--on' : ''}`}
            key={plan.months}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={plan.months}
              checked={plan.months === months}
              onChange={() => setMonths(plan.months)}
            />
            {persianCount(plan.months)} ماهه
          </label>
        ))}
      </fieldset>

      <p className="zn-instal__monthly">
        <span className="zn-instal__monthlylabel">قسط ماهانه</span>
        <span className="zn-instal__monthlyvalue">
          <span className="zn-instal__figure">{toman(chosen.monthlyRials)}</span>
          <span className="zn-instal__unit">تومان</span>
        </span>
      </p>

      <div className="zn-instal__foot">
        <span className="zn-instal__terms-note">بدون چک و ضامن · بدون پیش‌پرداخت</span>
        {/* A customer asking about instalments on a ring is better served by
            the ring terms than by the bare page, so the category travels. */}
        <Link className="zn-instal__cta" href={termsHref}>
          شرایط اقساط ‹
        </Link>
      </div>
    </section>
  );
}
