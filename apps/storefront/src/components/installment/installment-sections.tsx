import Link from 'next/link';
import type { ReactElement } from 'react';

import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronIcon,
  InfoIcon,
  LockIcon,
  PhoneIcon,
  ShieldPlainIcon,
  TermsIcon,
  InvoiceIcon,
} from '@/components/icons';
import { SUPPORT } from '@/config/brand';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import type { CostRow, EligibilityRow, InstallmentStep } from '@/server/content/installment-copy';
import type { PolicyQuestion } from '@/server/policy/shop-policy';

/*
 * The static parts of `/installment`, in the order the page draws them.
 *
 * Server components with no state: each takes its words from
 * `server/content/installment-copy.ts` and renders them, so an editor changes
 * a step or a question without touching markup.
 */

/** «مسیر خرید در چهار گام». */
export function InstallmentSteps({
  title,
  steps,
}: {
  readonly title: string;
  readonly steps: readonly InstallmentStep[];
}) {
  return (
    <section className="zn-instsec" aria-labelledby="steps-title">
      <h2 className="zn-instsec__title zn-instsec__title--solo" id="steps-title">
        {title}
      </h2>
      <ol className="zn-instcard zn-inststeps">
        {steps.map((step, index) => (
          <li
            className={`zn-inststeps__item${index === 0 ? ' zn-inststeps__item--first' : ''}`}
            key={step.title}
          >
            <span className="zn-inststeps__num" aria-hidden="true">
              {persianCount(index + 1)}
            </span>
            <span className="zn-inststeps__copy">
              <span className="zn-inststeps__title">{step.title}</span>
              <span className="zn-inststeps__body">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** «شرایط و مدارک». */
export function InstallmentEligibility({ rows }: { readonly rows: readonly EligibilityRow[] }) {
  return (
    <section className="zn-instsec" aria-labelledby="eligibility-title">
      <h2 className="zn-instsec__title" id="eligibility-title">
        شرایط و مدارک
      </h2>
      <p className="zn-instsec__lede">پیش از خرید اقساطی، این موارد را آماده داشته باشید.</p>
      <ul className="zn-instcard zn-instcard--rows zn-instchecks">
        {rows.map((row) => (
          <li
            className={`zn-instchecks__row${row.note === true ? ' zn-instchecks__row--note' : ''}`}
            key={row.text}
          >
            {row.note === true ? (
              <InfoIcon size={17} strokeWidth={2} />
            ) : (
              <span className="zn-instchecks__tick">
                <CheckIcon size={17} strokeWidth={2.2} />
              </span>
            )}
            {row.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The gold rate, and the promise that it stops mattering once an order is
 * placed.
 *
 * The canvas pulses a «live» dot and a daily change beside the figure. The
 * rate source says whether it is live; until it is, the card says when the
 * figure was taken instead of animating a claim it cannot make.
 */
export function InstallmentRateCard({
  title,
  price,
  unit,
  isLive,
  asOf,
  body,
  link,
}: {
  readonly title: string;
  /** Grouped Persian toman, formatted by the server. */
  readonly price: string;
  readonly unit: string;
  readonly isLive: boolean;
  readonly asOf: string;
  readonly body: string;
  readonly link: string;
}) {
  return (
    <section className="zn-instsec" aria-labelledby="rate-title">
      <div className="zn-instrate">
        <div className="zn-instrate__head">
          <span
            className={`zn-instrate__dot${isLive ? ' zn-instrate__dot--live' : ''}`}
            aria-hidden="true"
          />
          <h2 className="zn-instrate__title" id="rate-title">
            {title}
          </h2>
        </div>
        <div className="zn-instrate__figure">
          <span className="zn-instrate__price">
            <span className="zn-instrate__value">{price}</span>
            <span className="zn-instrate__unit">{unit}</span>
          </span>
          <span className="zn-instrate__asof">{isLive ? 'لحظه‌ای' : `به‌روزرسانی ${asOf}`}</span>
        </div>
        <p className="zn-instrate__body">{body}</p>
        <div className="zn-instrate__lockrow">
          <Link className="zn-instrate__link" href={routes.goldPrice()}>
            <LockIcon size={18} strokeWidth={1.75} />
            <span className="zn-instrate__linktext">{link}</span>
            <ChevronIcon size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** «هزینه‌ها با شفافیت کامل». */
export function InstallmentCosts({ rows }: { readonly rows: readonly CostRow[] }) {
  return (
    <section className="zn-instsec" aria-labelledby="costs-title">
      <h2 className="zn-instsec__title" id="costs-title">
        هزینه‌ها با شفافیت کامل
      </h2>
      <p className="zn-instsec__lede">هر چه پرداخت می‌کنید همین‌هاست؛ مورد دیگری اضافه نمی‌شود.</p>
      <dl className="zn-instcard zn-instcard--table zn-instcosts">
        {rows.map((row) => (
          <div className="zn-instcosts__row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.good === true ? 'zn-instcosts__good' : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * «سؤال‌های متداول», as native disclosures.
 *
 * `<details>` rather than the product page's accordion: the canvas lets any
 * number stay open, the answers are in the page source for search, and the
 * whole list works without JavaScript.
 */
export function InstallmentFaq({ questions }: { readonly questions: readonly PolicyQuestion[] }) {
  return (
    <section className="zn-instsec zn-instsec--anchor" id="faq" aria-labelledby="faq-title">
      <h2 className="zn-instsec__title zn-instsec__title--solo" id="faq-title">
        سؤال‌های متداول
      </h2>
      <div className="zn-instfaq">
        {questions.map((entry) => (
          <details className="zn-instfaq__item" key={entry.question}>
            <summary className="zn-instfaq__q">
              {entry.question}
              <span className="zn-instchev zn-instfaq__chev">
                <ChevronDownIcon size={16} strokeWidth={1.9} />
              </span>
            </summary>
            <p className="zn-instfaq__a">{entry.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const BADGE_ICON: Record<'shield' | 'lock' | 'invoice', ReactElement> = {
  shield: <ShieldPlainIcon size={14} strokeWidth={1.9} />,
  lock: <LockIcon size={14} strokeWidth={1.9} />,
  invoice: <InvoiceIcon size={14} strokeWidth={1.9} />,
};

/** The licences, the support line, the terms and «پیگیری سفارش‌ها», then the small print. */
export function InstallmentTrust({
  badges,
  footnote,
}: {
  readonly badges: readonly {
    readonly icon: 'shield' | 'lock' | 'invoice';
    readonly label: string;
  }[];
  readonly footnote: string;
}) {
  return (
    <section className="zn-instsec" aria-label="اعتماد و پشتیبانی">
      <div className="zn-instcard zn-insttrust">
        <ul className="zn-insttrust__badges">
          {badges.map((badge) => (
            <li className="zn-insttrust__badge" key={badge.label}>
              {BADGE_ICON[badge.icon]}
              {badge.label}
            </li>
          ))}
        </ul>
        <ul className="zn-insttrust__links">
          <li>
            <a className="zn-insttrust__link" href={`tel:${SUPPORT.telephone}`}>
              <PhoneIcon size={17} strokeWidth={1.8} />
              <span>
                پشتیبانی اقساط · <bdi dir="ltr">{SUPPORT.telephoneLabel}</bdi>
              </span>
              <ChevronIcon size={15} strokeWidth={1.9} />
            </a>
          </li>
          <li>
            <Link className="zn-insttrust__link" href={routes.terms()}>
              <TermsIcon />
              <span>قوانین و شرایط خرید</span>
              <ChevronIcon size={15} strokeWidth={1.9} />
            </Link>
          </li>
          <li>
            <Link className="zn-insttrust__link" href={routes.accountOrders()}>
              <CalendarIcon />
              <span>پیگیری سفارش‌های من</span>
              <ChevronIcon size={15} strokeWidth={1.9} />
            </Link>
          </li>
        </ul>
      </div>
      <p className="zn-insttrust__note">{footnote}</p>
    </section>
  );
}
