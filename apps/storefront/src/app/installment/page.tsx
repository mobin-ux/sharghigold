import type { Metadata } from 'next';
import Link from 'next/link';
import { installmentAmountTomanSchema } from '@sharghigold/contracts';
import { formatToman, rials, RIALS_PER_TOMAN, type Rials } from '@sharghigold/money';
import { toPersianDigits } from '@sharghigold/ui';

import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { ProductTile } from '@/components/home/product-tile';
import { CheckIcon } from '@/components/icons';
import {
  INSTALLMENT,
  INSTALLMENT_DEPOSIT_PERCENT,
  INSTALLMENT_MAX_MONTHS,
} from '@/config/commerce-terms';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';
import { getCategoryNavigation } from '@/server/catalogue/navigation';
import { priceInstallment } from '@/server/policy/installments';

import './installment.css';

export const metadata: Metadata = {
  title: 'خرید اقساطی طلا',
  description: `خرید اقساطی طلا با پیش‌پرداخت ${INSTALLMENT_DEPOSIT_PERCENT}٪ و بازپرداخت تا ${INSTALLMENT_MAX_MONTHS} ماه، بدون چک و ضامن.`,
  alternates: { canonical: '/installment' },
};

/* -------------------------------------------------------------------------- */
/* The calculator's input                                                     */
/* -------------------------------------------------------------------------- */

/** What the calculator prices when the URL says nothing. */
const DEFAULT_TOMAN = 50_000_000n;

function firstValue(raw: string | readonly string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : (raw as string | undefined);
}

/**
 * The amount to price, in toman.
 *
 * Bounded by the contract rather than by the `<input>`'s attributes, because
 * an attribute is a courtesy to whoever is typing and this is the check. An
 * amount outside the range prices the default instead of failing the page: a
 * calculator that 500s on a hand-edited URL is a calculator anyone can take
 * down with a link.
 */
function readAmount(raw: string | readonly string[] | undefined): bigint {
  const parsed = installmentAmountTomanSchema.safeParse(firstValue(raw) ?? '');
  return parsed.success ? parsed.data : DEFAULT_TOMAN;
}

/**
 * A term, and only one the shop actually offers.
 *
 * Membership in `INSTALLMENT.terms` rather than a range check: the shop offers
 * three terms, and a URL asking for a fourth must not be quoted one.
 */
function readMonths(raw: string | readonly string[] | undefined): number {
  const requested = Number(firstValue(raw));
  const fallback = INSTALLMENT.terms[1] ?? INSTALLMENT.terms[0];

  return (INSTALLMENT.terms as readonly number[]).includes(requested) ? requested : fallback;
}

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Instalment terms, a calculator, and what can be bought on them.
 *
 * `/installment` is in the bottom tab bar of every screen on the site, on the
 * homepage hero, on the homepage's gold panel, on every product page and on
 * eight category banners — and the route did not exist. It was the most
 * linked-to 404 in the shop.
 *
 * The calculator is a `method="get"` form. Submitting it puts the amount and
 * the term in the URL and re-renders on the server, so a quote can be shared
 * and returned to, the arithmetic happens where the money package is, and the
 * page needs no client JavaScript. A calculator that multiplies in the browser
 * is a calculator doing float arithmetic on a price.
 */
export default async function InstallmentPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const params = await searchParams;
  const toman = readAmount(params['amount']);
  const months = readMonths(params['months']);

  const cashTotal: Rials = rials(toman * RIALS_PER_TOMAN);
  const quote = priceInstallment(cashTotal, months);

  // A category may be pre-selected by a banner in the browser; it narrows the
  // rail below rather than changing the terms, which are the same everywhere.
  const requested = params['category'];
  const categorySlug = typeof requested === 'string' ? requested : undefined;

  const [eligible, navigation] = await Promise.all([
    listProducts({
      installment: true,
      inStock: true,
      sort: 'best-selling',
      ...(categorySlug === undefined ? {} : { category: categorySlug }),
    }),
    getCategoryNavigation(),
  ]);

  return (
    <>
      <a className="skip-link" href="#installment">
        رفتن به شرایط خرید اقساطی
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main id="installment">
          <header className="zn-insthead">
            <h1 className="zn-insthead__title">خرید اقساطی طلا</h1>
            <p className="zn-insthead__lede">
              طلا را امروز تحویل بگیرید و باقی مبلغ را ماهانه بپردازید. قیمت در لحظه ثبت سفارش قفل
              می‌شود و با نوسان بعدی بازار تغییر نمی‌کند.
            </p>

            <ul className="zn-insthead__points">
              {[
                `پیش‌پرداخت ${toPersianDigits(INSTALLMENT_DEPOSIT_PERCENT)}٪ در زمان ثبت سفارش`,
                `بازپرداخت ${INSTALLMENT.terms.map((term) => toPersianDigits(term)).join('، ')} ماهه`,
                `کارمزد ${toPersianDigits(INSTALLMENT.monthlySurchargeBasisPoints / 100)}٪ ماهانه روی مانده`,
                'بدون چک و ضامن، با احراز هویت آنلاین',
                'تحویل کالا پس از پرداخت پیش‌پرداخت',
              ].map((point) => (
                <li className="zn-insthead__point" key={point}>
                  <span className="zn-insthead__tick" aria-hidden="true">
                    <CheckIcon size={15} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </header>

          <section className="zn-calc" id="calculator" aria-labelledby="calc-title">
            <h2 className="zn-calc__title" id="calc-title">
              محاسبه قسط
            </h2>

            <form className="zn-calc__form" method="get" action={routes.installment()}>
              <label className="zn-calc__label" htmlFor="calc-amount">
                مبلغ خرید (تومان)
              </label>
              <input
                className="zn-calc__input"
                id="calc-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={toman.toString()}
                dir="ltr"
              />

              <fieldset className="zn-calc__terms">
                <legend className="zn-calc__label">مدت بازپرداخت</legend>
                {INSTALLMENT.terms.map((term) => (
                  <label className="zn-calc__term" key={term}>
                    <input
                      type="radio"
                      name="months"
                      value={term}
                      defaultChecked={term === months}
                    />
                    <span>{`${toPersianDigits(term)} ماه`}</span>
                  </label>
                ))}
              </fieldset>

              {categorySlug === undefined ? null : (
                <input type="hidden" name="category" value={categorySlug} />
              )}

              <button className="zn-calc__submit" type="submit">
                محاسبه کن
              </button>
            </form>

            <dl className="zn-calc__result">
              <div className="zn-calc__row">
                <dt>پیش‌پرداخت</dt>
                <dd>{formatToman(quote.deposit)}</dd>
              </div>
              <div className="zn-calc__row">
                <dt>{`قسط ماهانه (${toPersianDigits(months)} قسط)`}</dt>
                <dd>{formatToman(quote.monthly)}</dd>
              </div>
              <div className="zn-calc__row zn-calc__row--total">
                <dt>مبلغ نهایی</dt>
                <dd>{formatToman(quote.total)}</dd>
              </div>
              <div className="zn-calc__row zn-calc__row--muted">
                <dt>تفاوت با خرید نقدی</dt>
                <dd>{formatToman(rials(quote.total - cashTotal))}</dd>
              </div>
            </dl>

            <p className="zn-calc__note">
              این محاسبه تخمینی است. مبلغ دقیق هر قسط پیش از تأیید نهایی سفارش و بر اساس قیمت
              لحظه‌ای طلا به شما نشان داده می‌شود.
            </p>
          </section>

          <section className="zn-instlist" aria-labelledby="eligible-title">
            <div className="zn-instlist__head">
              <h2 className="zn-instlist__title" id="eligible-title">
                کالاهای قابل خرید اقساطی
              </h2>
              <Link className="zn-instlist__all" href={routes.products({ installment: true })}>
                مشاهده همه
              </Link>
            </div>

            <nav className="zn-listfacets" aria-label="محدود کردن به یک دسته">
              <Link
                className={`zn-listfacet${categorySlug === undefined ? ' zn-listfacet--on' : ''}`}
                href={routes.installment()}
              >
                همه
              </Link>
              {navigation.categories
                .filter((category) => category.installmentEligible)
                .map((category) => (
                  <Link
                    className={`zn-listfacet${category.slug === categorySlug ? ' zn-listfacet--on' : ''}`}
                    key={category.slug}
                    href={routes.installment({ category: category.slug })}
                  >
                    {category.title}
                  </Link>
                ))}
            </nav>

            {eligible.items.length === 0 ? (
              <p className="zn-empty">در این دسته فعلاً کالای اقساطی موجود نیست.</p>
            ) : (
              <ul className="zn-rail" tabIndex={0} aria-labelledby="eligible-title">
                {eligible.items.slice(0, 8).map((product) => (
                  <li className="zn-rail__item" key={product.slug}>
                    <ProductTile product={product} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="zn-insthow" aria-labelledby="how-title">
            <h2 className="zn-insthow__title" id="how-title">
              مراحل خرید اقساطی
            </h2>
            <ol className="zn-insthow__steps">
              {[
                'کالا را انتخاب کنید و به سبد خرید اضافه کنید.',
                'در مرحله پرداخت، «خرید اقساطی» و مدت بازپرداخت را انتخاب کنید.',
                'احراز هویت آنلاین با کد ملی و شماره موبایل انجام می‌شود.',
                'پیش‌پرداخت را می‌پردازید و کالا ارسال می‌شود.',
                'اقساط ماهانه از کیف پول یا درگاه بانکی پرداخت می‌شود.',
              ].map((step, index) => (
                <li className="zn-insthow__step" key={step}>
                  <span className="zn-insthow__num" aria-hidden="true">
                    {toPersianDigits(index + 1)}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
