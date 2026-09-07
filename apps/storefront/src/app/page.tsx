import { PriceTicker } from '@sharghigold/ui';

import { BottomNav } from '@/components/bottom-nav';
import { BestSellers } from '@/components/home/best-sellers';
import { CategoryGrid } from '@/components/home/category-grid';
import { DealsRail } from '@/components/home/deals-rail';
import { HeroCarousel, type HeroSlide } from '@/components/home/hero-carousel';
import { InstallmentCta } from '@/components/home/installment-cta';
import { MagazineRail } from '@/components/home/magazine-rail';
import { Newsletter } from '@/components/home/newsletter';
import { ProductRail } from '@/components/home/product-rail';
import { SectionHeader } from '@/components/home/section-header';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { TrustStrip } from '@/components/home/trust-strip';
import { WeightGrid } from '@/components/home/weight-grid';
import {
  DEMO_ARTICLES,
  DEMO_BEST_SELLERS,
  DEMO_CATEGORY_FILTERS,
  DEMO_NEW_ARRIVALS,
  DEMO_OFFERS,
} from '@/data/demo-catalogue';
import { BRAND } from '@/config/brand';
import { toProductViews } from '@/lib/catalogue';
import { buildTicker } from '@/lib/ticker';

import './home.css';

/** Longest installment term offered. Commercial term, not a layout constant. */
const MAX_INSTALLMENT_MONTHS = 36;

/**
 * Time left on the flash sale.
 *
 * Fixed for now. It must end up coming from the promotion record on the
 * server: a countdown derived from the visitor's own clock can be moved by
 * changing the device's time, and an offer that expires when the customer says
 * so is not an offer.
 */
const DEAL_SECONDS_REMAINING = 8_079;

const HERO_SLIDES: readonly HeroSlide[] = [
  {
    eyebrow: 'مجموعه عروس ۱۴۰۵',
    headline: ['سرویس‌های عروس', 'با ۱۵٪ تخفیف اجرت'],
    note: 'فقط تا پایان مرداد',
    cta: 'مشاهده سرویس‌ها',
    href: '/categories/sets',
  },
  {
    eyebrow: 'خرید اقساطی',
    headline: ['طلا را قسطی', 'بخرید'],
    note: 'تا ۳۶ ماه، بدون چک و ضامن',
    cta: 'شرایط اقساط',
    href: '/installment',
  },
  {
    eyebrow: 'نو رسیده‌ها',
    headline: ['گوشواره‌های', 'تازه رسیده'],
    note: '۴۲ مدل جدید این هفته',
    cta: 'تازه‌ها را ببینید',
    href: '/categories/earrings',
  },
];

/**
 * The mobile homepage.
 *
 * A Server Component, and almost all of it stays that way. Only four things
 * hydrate: the hero carousel, the flash-sale countdown, the best-seller filter
 * and the tab bar. Everything else — every product, every price, every link —
 * is HTML the first time it arrives.
 *
 * That is not a performance preference. Product pages have to be crawlable,
 * and prices are `bigint` rials that are computed and formatted here, on the
 * server, because a bigint cannot cross into the client and a price that
 * became a float on the way has already lost precision it cannot get back.
 */
export default function HomePage() {
  const newArrivals = toProductViews(DEMO_NEW_ARRIVALS);
  const offers = toProductViews(DEMO_OFFERS);
  const bestSellers = toProductViews(DEMO_BEST_SELLERS);
  const ticker = buildTicker();

  return (
    <>
      <a className="skip-link" href="#main">
        رفتن به محتوای اصلی
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <PriceTicker
          items={ticker.items}
          label="قیمت لحظه‌ای"
          asOf={`آخرین به‌روزرسانی: ${ticker.asOf}`}
        />

        <main id="main">
          {/* The design has no visible page title — the wordmark sits in the
              header, where it repeats on every page and so cannot be the h1.
              This gives the document the one top-level heading it needs: a
              crawler reads it as what the page is about, and a screen reader
              user landing here hears where they are before the carousel. */}
          <h1 className="sr-only">فروشگاه آنلاین طلا و جواهر {BRAND.name}</h1>

          <HeroCarousel slides={HERO_SLIDES} />

          <CategoryGrid />
          <TrustStrip />

          <ProductRail
            id="new-arrivals-heading"
            title="نو رسیده‌ها"
            href="/products?sort=newest"
            products={newArrivals}
          />

          <InstallmentCta maxMonths={MAX_INSTALLMENT_MONTHS} />

          <DealsRail products={offers} secondsRemaining={DEAL_SECONDS_REMAINING} />

          <section className="zn-section" aria-labelledby="best-heading">
            <SectionHeader
              id="best-heading"
              title="پرفروش‌ترین‌ها"
              href="/products?sort=best-selling"
            />
            <BestSellers products={bestSellers} filters={[...DEMO_CATEGORY_FILTERS]} />
          </section>

          <WeightGrid />

          <MagazineRail articles={DEMO_ARTICLES} />

          <Newsletter />
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
