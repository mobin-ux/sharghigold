import type { Metadata } from 'next';
import Link from 'next/link';
import { formatToman } from '@sharghigold/money';

import { BottomNav } from '@/components/bottom-nav';
import { ProductTile } from '@/components/home/product-tile';
import { CallbackPanel } from '@/components/installment/callback-panel';
import { InstallmentCalculator } from '@/components/installment/installment-calculator';
import { InstallmentHeader, InstallmentHero } from '@/components/installment/installment-hero';
import {
  InstallmentCosts,
  InstallmentEligibility,
  InstallmentFaq,
  InstallmentRateCard,
  InstallmentSteps,
  InstallmentTrust,
} from '@/components/installment/installment-sections';
import { QuoteBar } from '@/components/installment/quote-bar';
import {
  INSTALLMENT,
  INSTALLMENT_DEPOSIT_PERCENT,
  INSTALLMENT_MAX_MONTHS,
} from '@/config/commerce-terms';
import { getGoldRate } from '@/lib/gold-price';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';
import { getCategoryNavigation } from '@/server/catalogue/navigation';
import {
  CALCULATOR_COPY,
  CALLBACK_COPY,
  INSTALLMENT_ASSURANCES,
  INSTALLMENT_COSTS,
  INSTALLMENT_ELIGIBILITY,
  INSTALLMENT_FOOTNOTE,
  INSTALLMENT_HERO,
  INSTALLMENT_STEPS,
  installmentFaqs,
  RATE_COPY,
  TRUST_BADGES,
} from '@/server/content/installment-copy';
import { quoteFromQuery } from '@/server/policy/installment-calculator';

import './installment.css';

export const metadata: Metadata = {
  title: 'خرید اقساطی طلا',
  description: `خرید اقساطی طلا با پیش‌پرداخت ${INSTALLMENT_DEPOSIT_PERCENT}٪ و بازپرداخت تا ${INSTALLMENT_MAX_MONTHS} ماه، بدون چک و ضامن.`,
  alternates: { canonical: routes.installment() },
};

/**
 * `/installment`, as the `Zarnama Installment` canvas draws it.
 *
 * The page renders on the server. The calculator is a client island only so
 * that typing can replace the URL; the quote itself is `quoteFromQuery`, the
 * same `priceInstallment` checkout charges with, so the page cannot advertise
 * a monthly figure checkout would not ask for.
 *
 * Where the canvas describes a different product — an instant credit check
 * with its own application form, a 36-month plan, a deposit the customer
 * picks, lending partners, approval statistics — the page draws the shop's
 * actual terms instead. ADR 0012 lists each departure.
 */
export default async function InstallmentPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const params = await searchParams;
  const quote = quoteFromQuery(params['amount'], params['months']);

  // Banners in the category pages send `?category=`; it narrows the rail of
  // pieces, never the terms, which are the same for everything.
  const navigation = await getCategoryNavigation();
  const eligibleCategories = navigation.categories.filter(
    (category) => category.installmentEligible,
  );
  const requested = params['category'];
  const category = eligibleCategories.find((entry) => entry.slug === requested);

  const eligible = await listProducts({
    installment: true,
    inStock: true,
    sort: 'best-selling',
    ...(category === undefined ? {} : { category: category.slug }),
  });

  const shopHref =
    category === undefined
      ? routes.products({ installment: true })
      : routes.category(category.slug, { installment: true });

  const rate = getGoldRate();

  return (
    <>
      <a className="skip-link" href="#calculator">
        رفتن به محاسبه‌گر اقساط
      </a>

      <div className="zn-shell zn-shell--installment">
        <InstallmentHeader title="خرید اقساطی طلا" />

        <main>
          <InstallmentHero
            badge={INSTALLMENT_HERO.badge}
            title={INSTALLMENT_HERO.title}
            lede={INSTALLMENT_HERO.lede}
            cta={INSTALLMENT_HERO.cta}
            assurances={INSTALLMENT_ASSURANCES}
          />

          <section
            className="zn-instsec zn-instsec--calc zn-instsec--anchor"
            id="calculator"
            aria-labelledby="calculator-title"
          >
            <div className="zn-instsec__head">
              <h2 className="zn-instsec__title" id="calculator-title">
                {CALCULATOR_COPY.title}
              </h2>
              <span className="zn-instsec__aside">{CALCULATOR_COPY.unitNote}</span>
            </div>
            <p className="zn-instsec__lede">{CALCULATOR_COPY.lede}</p>

            <InstallmentCalculator
              quote={quote}
              terms={INSTALLMENT.terms}
              depositPercent={INSTALLMENT_DEPOSIT_PERCENT}
              categorySlug={category?.slug}
              shopHref={shopHref}
              copy={CALCULATOR_COPY}
            />
          </section>

          <InstallmentSteps title="مسیر خرید در چهار گام" steps={INSTALLMENT_STEPS} />
          <InstallmentEligibility rows={INSTALLMENT_ELIGIBILITY} />

          <InstallmentRateCard
            title={RATE_COPY.title}
            price={formatToman(rate.pricePerGram18k, { withUnit: false })}
            unit={RATE_COPY.unit}
            isLive={rate.isLive}
            asOf={rate.asOf}
            body={RATE_COPY.body}
            link={RATE_COPY.link}
          />

          {eligible.items.length === 0 ? null : (
            <section className="zn-instsec zn-instsec--rail" aria-labelledby="eligible-title">
              <div className="zn-instsec__head zn-instsec__head--rail">
                <h2 className="zn-instsec__title" id="eligible-title">
                  {category === undefined ? 'قابل خرید با اقساط' : `${category.title} اقساطی`}
                </h2>
                <Link className="zn-instsec__all" href={shopHref}>
                  همه محصولات
                </Link>
              </div>
              <ul className="zn-rail zn-instrail" aria-labelledby="eligible-title">
                {eligible.items.slice(0, 8).map((product) => (
                  <li className="zn-rail__item" key={product.slug}>
                    <ProductTile product={product} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <InstallmentCosts rows={INSTALLMENT_COSTS} />
          <InstallmentFaq
            questions={installmentFaqs(eligibleCategories.map((entry) => entry.title))}
          />
          <CallbackPanel
            title={CALLBACK_COPY.title}
            body={CALLBACK_COPY.body}
            submit={CALLBACK_COPY.submit}
          />
          <InstallmentTrust badges={TRUST_BADGES} footnote={INSTALLMENT_FOOTNOTE} />
        </main>

        <QuoteBar months={quote.months} monthlyRials={quote.monthlyRials} href={shopHref} />
        <BottomNav />
      </div>
    </>
  );
}
