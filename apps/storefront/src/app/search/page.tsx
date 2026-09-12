import type { Metadata } from 'next';
import Link from 'next/link';
import { parseListingQuery } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { ProductListingView } from '@/components/catalogue/product-listing';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';
import { getCategoryNavigation } from '@/server/catalogue/navigation';

import '../listing.css';

export const metadata: Metadata = {
  title: 'جست‌وجو',
  description: 'جست‌وجو در محصولات زرنما.',
  // A search result page is not a page a crawler should index: the set of
  // them is unbounded and each one duplicates a listing that already has an
  // address. The site-wide default in the root layout says index; this
  // overrides it for this route alone.
  robots: { index: false, follow: true },
};

/**
 * Search.
 *
 * The header's search box has pointed at `/search` on every page of the site
 * since the header was built, and the route did not exist — so pressing Enter
 * in the shop's own search box landed on a 404.
 *
 * The form is a plain `method="get"`, which is why this page works at all: the
 * term is in the URL, so a result set can be shared, bookmarked and returned
 * to with the back button, and the page needs no client JavaScript to exist.
 *
 * With no term it shows the categories rather than the whole catalogue. An
 * empty search that returns four hundred products is not an answer.
 */
export default async function SearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const query = parseListingQuery(await searchParams);

  if (query.q === undefined) {
    const navigation = await getCategoryNavigation();

    return (
      <>
        <div className="zn-shell">
          <SiteHeader />

          <main id="search">
            <header className="zn-listhead">
              <h1 className="zn-listhead__title">جست‌وجو</h1>
              <p className="zn-listhead__note">
                نام کالا، مدل یا کد کالا را در کادر بالا بنویسید — یا از دسته‌بندی‌ها شروع کنید.
              </p>
            </header>

            <nav className="zn-listfacets" aria-label="دسته‌بندی‌ها">
              {navigation.categories.map((category) => (
                <Link
                  className="zn-listfacet"
                  key={category.slug}
                  href={routes.category(category.slug)}
                >
                  {category.title}
                </Link>
              ))}
            </nav>
          </main>

          <SiteFooter />
          <BottomNav />
        </div>
      </>
    );
  }

  const listing = await listProducts(query);

  return (
    <>
      <a className="skip-link" href="#search">
        رفتن به نتایج جست‌وجو
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main id="search">
          <header className="zn-listhead">
            <h1 className="zn-listhead__title">{`نتایج «${query.q}»`}</h1>
          </header>

          <ProductListingView basePath={routes.search()} query={query} listing={listing} />
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
