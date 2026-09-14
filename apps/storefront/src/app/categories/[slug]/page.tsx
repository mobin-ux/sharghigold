import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseListingQuery } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { BuyingGuide } from '@/components/catalogue/buying-guide';
import { CategoryHeader, type Crumb } from '@/components/catalogue/category-header';
import { InstallmentBanner } from '@/components/catalogue/installment-banner';
import { ListingResults } from '@/components/catalogue/listing-results';
import { ListingToolbar } from '@/components/catalogue/listing-toolbar';
import { SubCategoryRail } from '@/components/catalogue/subcategory-rail';
import { categoryFacets, clearedHref } from '@/lib/listing-view';
import { routes } from '@/lib/routes';
import { listProducts } from '@/server/catalogue/listing';
import { getCategoryNavigation, resolveCategory } from '@/server/catalogue/navigation';
import { categoryCopy, subTypeHeading } from '@/server/content/category-copy';

import '../../listing.css';

type Params = Promise<{ readonly slug: string }>;

/**
 * Find the category a URL names, and the words to put around it.
 *
 * Shared by the metadata and the page so the two cannot disagree about which
 * category is being shown — a title naming one category over a grid of
 * another is worse than no title.
 */
async function resolve(slug: string) {
  const resolved = resolveCategory(await getCategoryNavigation(), slug);
  if (resolved === undefined) return undefined;

  const copy = categoryCopy(resolved.category.slug, resolved.category.title);
  const heading = resolved.isSubType ? subTypeHeading(copy, resolved.title) : copy.heading;

  return { ...resolved, copy, heading };
}

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const resolved = await resolve((await params).slug);

  if (resolved === undefined) return { title: 'دسته‌بندی پیدا نشد' };

  return {
    title: resolved.heading,
    description: `خرید ${resolved.heading} از زرنما، با فاکتور رسمی و ضمانت اصالت.`,
    alternates: { canonical: routes.category(resolved.slug) },
  };
}

/**
 * One category's products, as the `Zarnama Category` canvas draws them.
 *
 * A slug that names nothing is a 404 rather than a redirect to the first
 * category: a customer who lands on `/categories/watches` and is shown
 * earrings has been told something untrue. Sub-types resolve to their parent
 * category and narrow the grid to themselves, so `/categories/earrings-drop`
 * is the «آویز» tile's own page, with the same header, rail and sheet.
 *
 * The page renders on the server. The toolbar is the only client island, and
 * only because its sheets open in place; every filter it applies is a URL.
 */
export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  readonly params: Params;
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (resolved === undefined) notFound();

  const { category, copy, isSubType } = resolved;

  // The category comes from the path, never from the query: one grid, one
  // address. A `?category=` on a category page would be a second way to say
  // the same thing, and the two would eventually disagree.
  const query = { ...parseListingQuery(await searchParams), category: resolved.slug };
  const listing = await listProducts(query, { cumulative: true });

  const basePath = routes.category(resolved.slug);
  const categoryPath = routes.category(category.slug);
  const facets = categoryFacets(category, (tileSlug) => routes.category(tileSlug));

  // A sub-type is a filter in the sheet's terms, so it counts toward the badge
  // and «حذف فیلترها» widens back to the whole category.
  const filterCount = listing.activeFilterCount + (isSubType ? 1 : 0);
  const clearHref = clearedHref(categoryPath, query);

  const crumbs: readonly Crumb[] = isSubType
    ? [
        { label: 'خانه', href: routes.home() },
        { label: category.title, href: categoryPath },
        { label: resolved.title },
      ]
    : [
        { label: 'خانه', href: routes.home() },
        { label: 'دسته‌بندی‌ها', href: routes.categories(category.slug) },
        { label: category.title },
      ];

  return (
    <>
      <a className="skip-link" href="#products">
        رفتن به فهرست کالاها
      </a>

      <div className="zn-shell zn-shell--listing">
        <CategoryHeader
          title={resolved.heading}
          backHref={isSubType ? categoryPath : routes.categories(category.slug)}
          crumbs={crumbs}
        />

        <SubCategoryRail
          label={`مدل‌های ${category.title}`}
          links={[
            {
              label: `همه ${copy.noun}‌ها`,
              href: categoryPath,
              icon: null,
              current: !isSubType,
            },
            ...facets.models.map((model) => ({
              label: model.label,
              href: model.basePath,
              icon: model.icon,
              current: model.slug === resolved.slug,
            })),
          ]}
        />

        <ListingToolbar
          basePath={basePath}
          query={query}
          total={listing.total}
          filterCount={filterCount}
          facets={facets}
          sticky
        />

        <main id="products">
          <ListingResults
            basePath={basePath}
            query={query}
            listing={listing}
            filterCount={filterCount}
            clearHref={clearHref}
          />

          {category.installmentEligible ? (
            <InstallmentBanner noun={copy.noun} categorySlug={category.slug} />
          ) : null}

          {copy.hasGuide ? <BuyingGuide title={copy.guide.title} body={copy.guide.body} /> : null}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
