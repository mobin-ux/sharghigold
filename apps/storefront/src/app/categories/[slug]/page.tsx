import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseListingQuery } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { ProductListingView } from '@/components/catalogue/product-listing';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';
import { getCategoryNavigation, resolveCategory } from '@/server/catalogue/navigation';

import '../../listing.css';

/**
 * Find the category a URL names, or nothing.
 *
 * Shared by the metadata and the page so the two cannot disagree about which
 * category is being shown — a title naming one category over a grid of
 * another is worse than no title.
 */
async function resolve(slug: string) {
  return resolveCategory(await getCategoryNavigation(), slug);
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const resolved = await resolve((await params).slug);

  if (resolved === undefined) return { title: 'دسته‌بندی پیدا نشد' };

  return {
    title: resolved.title,
    description: `خرید ${resolved.title} از زرنما، با فاکتور رسمی و ضمانت اصالت.`,
    alternates: { canonical: routes.category(resolved.slug) },
  };
}

/**
 * One category's products.
 *
 * Seventeen links in the category browser pointed here and every one of them
 * was a 404 — the browser was built, the listing it leads to was not.
 *
 * A slug that names nothing is a 404 rather than a redirect to the first
 * category. `selectCategory` deliberately falls back for the *browser*, where
 * showing something beats showing an error; a listing is a different promise,
 * and a customer who lands on `/categories/watches` and is shown earrings has
 * been told something untrue.
 *
 * Sub-types are not categories — `rings-solitaire` is a facet tile — so the
 * page resolves both and narrows to whichever it was given.
 */
export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (resolved === undefined) notFound();

  // The category comes from the path, never from the query: one grid, one
  // address. A `?category=` in the URL of a category page would be a second
  // way to say the same thing, and the two would eventually disagree.
  const query = { ...parseListingQuery(await searchParams), category: resolved.slug };
  const listing = await listProducts(query);

  const subTypes = resolved.category.groups.find((group) => group.kind === 'models')?.tiles ?? [];
  const basePath = routes.category(resolved.slug);

  return (
    <>
      <a className="skip-link" href="#products">
        رفتن به فهرست محصولات
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main id="products">
          <header className="zn-listhead">
            <h1 className="zn-listhead__title">{resolved.title}</h1>
            <p className="zn-listhead__note">
              {resolved.isSubType
                ? `${resolved.category.title} — ${resolved.title}`
                : 'قیمت هر قطعه از وزن و نرخ لحظه‌ای طلا محاسبه می‌شود.'}
            </p>
          </header>

          {subTypes.length === 0 ? null : (
            <nav className="zn-listfacets" aria-label={`مدل‌های ${resolved.category.title}`}>
              <Link
                className={`zn-listfacet${resolved.isSubType ? '' : ' zn-listfacet--on'}`}
                href={routes.category(resolved.category.slug)}
                aria-current={resolved.isSubType ? undefined : 'true'}
              >
                همه
              </Link>
              {subTypes
                .filter((tile) => tile.slug !== resolved.category.slug)
                .map((tile) => (
                  <Link
                    className={`zn-listfacet${tile.slug === resolved.slug ? ' zn-listfacet--on' : ''}`}
                    key={tile.slug}
                    href={routes.category(tile.slug)}
                    aria-current={tile.slug === resolved.slug ? 'true' : undefined}
                  >
                    {tile.label}
                  </Link>
                ))}
            </nav>
          )}

          <ProductListingView basePath={basePath} query={query} listing={listing} />
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
