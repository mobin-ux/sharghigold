import type { Metadata } from 'next';
import { parseListingQuery } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { ProductListingView } from '@/components/catalogue/product-listing';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';

import '../listing.css';

export const metadata: Metadata = {
  title: 'همه محصولات',
  description: 'همه طلا و جواهر زرنما، با فیلتر وزن، عیار، رنگ و تخفیف اجرت.',
  alternates: { canonical: '/products' },
};

/**
 * The whole shop, filtered.
 *
 * This page did not exist. The homepage's «مشاهده همه» links, its weight
 * bands and two of its section headings all pointed here, so five separate
 * routes into the catalogue ended on the framework's own 404 — in English, in
 * the wrong direction, with no way back into the shop.
 *
 * Every filter is a query parameter parsed on the server. Nothing is filtered
 * in the browser: a grid that hides cards it has already sent puts every
 * excluded product in the page source and makes «filtered» a description of
 * what is painted rather than of what was sent.
 */
export default async function ProductsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const query = parseListingQuery(await searchParams);
  const listing = await listProducts(query);

  return (
    <>
      <a className="skip-link" href="#products">
        رفتن به فهرست محصولات
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main id="products">
          <header className="zn-listhead">
            <h1 className="zn-listhead__title">همه محصولات</h1>
            <p className="zn-listhead__note">
              قیمت هر قطعه از وزن و نرخ لحظه‌ای طلا محاسبه می‌شود و با تغییر نرخ به‌روز می‌شود.
            </p>
          </header>

          <ProductListingView basePath={routes.products()} query={query} listing={listing} />
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
