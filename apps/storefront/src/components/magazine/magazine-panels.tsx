import Link from 'next/link';

import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';

/** The teal masthead of the magazine home. */
export function MagazineMasthead({
  name,
  badge,
  lede,
  stats,
}: {
  readonly name: string;
  readonly badge: string;
  readonly lede: string;
  /** Counts the page derives from its own content, never typed in. */
  readonly stats: readonly { readonly value: number; readonly label: string }[];
}) {
  return (
    <section className="zn-magmast" aria-labelledby="magazine-title">
      <span className="zn-magmast__badge">
        <span className="zn-magmast__dot" aria-hidden="true" />
        {badge}
      </span>
      <h1 className="zn-magmast__title" id="magazine-title">
        {name}
      </h1>
      <p className="zn-magmast__lede">{lede}</p>
      <ul className="zn-magstats">
        {stats.map((stat) => (
          <li className="zn-magstats__item" key={stat.label}>
            <span className="zn-magstats__value">{persianCount(stat.value)}</span>
            <span className="zn-magstats__label">{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The gold rate in a strip, with a way to the full price page.
 *
 * The canvas pulses a live dot and a daily change. The rate source says
 * whether it is live; until it is, the strip says when the figure was taken.
 */
export function RateStrip({
  price,
  isLive,
  asOf,
}: {
  /** Grouped Persian toman per gram of 18k. */
  readonly price: string;
  readonly isLive: boolean;
  readonly asOf: string;
}) {
  return (
    <section className="zn-magsec zn-magsec--rate" aria-labelledby="rate-strip-title">
      <div className="zn-magrate">
        <div className="zn-magrate__copy">
          <h2 className="zn-magrate__label" id="rate-strip-title">
            <span
              className={`zn-magrate__dot${isLive ? ' zn-magrate__dot--live' : ''}`}
              aria-hidden="true"
            />
            {isLive ? 'قیمت لحظه‌ای بازار' : 'قیمت طلا'}
          </h2>
          <span className="zn-magrate__price">{`گرم ۱۸ عیار ${price} تومان`}</span>
          <span className="zn-magrate__asof">{`به‌روزرسانی ${asOf}`}</span>
        </div>
        <Link className="zn-magrate__cta" href={routes.goldPrice()}>
          جدول قیمت
        </Link>
      </div>
    </section>
  );
}

/** «هنوز مطمئن نیستید چه بخرید؟» */
export function AdviceCard() {
  return (
    <section className="zn-magsec zn-magsec--end" aria-labelledby="advice-title">
      <div className="zn-magadvice">
        <h2 className="zn-magadvice__title" id="advice-title">
          هنوز مطمئن نیستید چه بخرید؟
        </h2>
        <p className="zn-magadvice__body">
          کارشناسان پشتیبانی زرنما بر اساس بودجه و هدف شما، گزینه مناسب را پیشنهاد می‌دهند.
        </p>
        <div className="zn-magadvice__actions">
          <Link className="zn-magbtn zn-magbtn--gold zn-magbtn--grow" href={routes.contact()}>
            تماس با کارشناس
          </Link>
          <Link className="zn-magbtn zn-magbtn--light zn-magbtn--grow" href={routes.categories()}>
            دیدن محصولات
          </Link>
        </div>
      </div>
    </section>
  );
}
