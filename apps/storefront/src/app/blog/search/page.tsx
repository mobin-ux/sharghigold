import type { Metadata } from 'next';
import Link from 'next/link';
import { parseMagazineSearch } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { SearchIcon } from '@/components/icons';
import { ArticleResult, RankedArticle } from '@/components/magazine/article-cards';
import { MagazineHeader } from '@/components/magazine/magazine-chrome';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import {
  MAGAZINE_COPY,
  popularArticles,
  searchArticles,
  topicById,
} from '@/server/content/magazine';

import '../magazine.css';

export const metadata: Metadata = {
  title: 'جست‌وجو در مجله',
  // A results page per typed term is not something to index.
  robots: { index: false, follow: true },
};

/**
 * Search the magazine.
 *
 * A `method="get"` form, so the term is the address and the results render on
 * the server; the canvas filters as the reader types, which would need the
 * whole archive in the browser. The term is bounded by the contract before it
 * reaches `searchArticles`, which only ever compares it to text it holds.
 */
export default async function MagazineSearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const term = parseMagazineSearch(await searchParams);
  const results = term === '' ? [] : searchArticles(term);

  return (
    <div className="zn-shell zn-shell--magazine">
      <MagazineHeader title="جست‌وجو در مجله" back={routes.blog()} />

      <main>
        <section className="zn-magsearch">
          <form
            className="zn-magsearch__form"
            role="search"
            method="get"
            action={routes.blogSearch()}
          >
            <label className="sr-only" htmlFor="magazine-search">
              جست‌وجو در مقاله‌ها
            </label>
            <span className="zn-magsearch__icon" aria-hidden="true">
              <SearchIcon size={18} strokeWidth={1.8} />
            </span>
            <input
              className="zn-magsearch__input"
              id="magazine-search"
              name="q"
              type="search"
              maxLength={80}
              defaultValue={term}
              placeholder="جست‌وجو در مقاله‌ها…"
              enterKeyHint="search"
            />
          </form>
        </section>

        {term === '' ? (
          <section className="zn-magsec zn-magsec--search" aria-labelledby="suggest-title">
            <h2 className="zn-magsec__title zn-magsec__title--md" id="suggest-title">
              پیشنهاد جست‌وجو
            </h2>
            <ul className="zn-magtags">
              {MAGAZINE_COPY.suggestedSearches.slice(0, 6).map((suggestion) => (
                <li key={suggestion}>
                  <Link className="zn-magtag zn-magtag--lg" href={routes.blogSearch(suggestion)}>
                    {suggestion}
                  </Link>
                </li>
              ))}
            </ul>
            <h2
              className="zn-magsec__title zn-magsec__title--md zn-magsec__title--gap"
              id="popular-title"
            >
              پربازدیدترین‌ها
            </h2>
            <ol className="zn-maglist zn-maglist--tight" aria-labelledby="popular-title">
              {popularArticles(3).map((article, index) => (
                <li key={article.slug}>
                  <RankedArticle article={article} rank={index + 1} />
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="zn-magsec zn-magsec--results" aria-label="نتیجه‌ها">
            <p className="zn-magsearch__count" role="status">
              {`${persianCount(results.length)} نتیجه برای «${term}»`}
            </p>
            {results.length === 0 ? (
              <div className="zn-magempty">
                <span className="zn-magempty__title">نتیجه‌ای پیدا نشد</span>
                <span className="zn-magempty__body">
                  عبارت کوتاه‌تری امتحان کنید یا از موضوع‌های پیشنهادی شروع کنید. برای پرسش مشخص،
                  تماس با کارشناس سریع‌تر است.
                </span>
                <Link
                  className="zn-magbtn zn-magbtn--gold zn-magbtn--inline"
                  href={routes.contact()}
                >
                  پرسیدن از کارشناس
                </Link>
              </div>
            ) : (
              <ul className="zn-maglist zn-maglist--tight">
                {results.map((article) => (
                  <li key={article.slug}>
                    <ArticleResult article={article} topicLabel={topicById(article.topic).label} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
