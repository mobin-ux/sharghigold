import type { Metadata } from 'next';

import { BottomNav } from '@/components/bottom-nav';
import { CategoryBrowser } from '@/components/categories/category-browser';
import { CategorySearch } from '@/components/categories/category-search';
import { getCategoryNavigation, selectCategory } from '@/server/catalogue/navigation';

import './categories.css';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها',
  description:
    'همه دسته‌بندی‌های زرنما: گوشواره، گردنبند، انگشتر، النگو، دستبند، سرویس، سکه و شمش و هدیه.',
};

/**
 * The category browser.
 *
 * An app shell rather than a scrolling document: the search bar and the tab
 * bar are pinned, and the two columns between them scroll independently. That
 * is what the canvas draws, and it is right for this screen — the rail has to
 * stay reachable while the panel is being read.
 *
 * The whole catalogue is fetched on the server and handed to one client
 * component. Rendering it here rather than in the browser keeps every facet
 * link in the initial HTML, which is what makes the category tree crawlable;
 * the client component only decides which part of it is visible.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const navigation = await getCategoryNavigation();

  // Only ever matched against slugs the catalogue already holds — an unknown
  // or hostile value selects the default rather than reaching anything.
  const requested = (await searchParams)['category'];
  const active = selectCategory(navigation, typeof requested === 'string' ? requested : undefined);

  return (
    <>
      <a className="skip-link" href="#categories">
        رفتن به فهرست دسته‌بندی‌ها
      </a>

      <div className="zn-appshell">
        <CategorySearch />

        <main className="zn-appshell__body" id="categories">
          <h1 className="sr-only">دسته‌بندی محصولات</h1>
          <CategoryBrowser navigation={navigation} initialSlug={active.slug} />
        </main>

        <BottomNav docked />
      </div>
    </>
  );
}
