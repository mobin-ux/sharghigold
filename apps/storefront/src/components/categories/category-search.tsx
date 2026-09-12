import Link from 'next/link';

import { ArrowRightIcon, SearchIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

/**
 * The teal bar at the top of the category browser: a way back, and search.
 *
 * A Server Component, and the search is the same real `method="get"` form the
 * site header uses — it submits on Enter, works before hydration, and leaves
 * the query in the URL.
 *
 * The back control is a link to the homepage rather than a `history.back()`
 * button, which is what the canvas points it at. It also behaves better: a
 * customer who landed here from a search engine has no history to go back to,
 * and a button that does nothing is worse than one that goes somewhere
 * predictable.
 */
export function CategorySearch() {
  return (
    <div className="zn-catsearch">
      <Link className="zn-catsearch__back" href={routes.home()} aria-label="بازگشت به صفحه اصلی">
        <ArrowRightIcon />
      </Link>

      <form className="zn-catsearch__field" action="/search" method="get" role="search">
        <label className="sr-only" htmlFor="category-search">
          جست‌وجو در محصولات
        </label>
        <span className="zn-catsearch__icon">
          <SearchIcon size={17} strokeWidth={1.7} />
        </span>
        <input
          className="zn-catsearch__input"
          id="category-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="جست‌وجو در زرنما"
        />
      </form>
    </div>
  );
}
