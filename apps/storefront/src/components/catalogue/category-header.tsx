import Link from 'next/link';

import { ArrowRightIcon, SearchIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

export interface Crumb {
  readonly label: string;
  /** Absent on the last crumb, which is the page itself. */
  readonly href?: string;
}

/**
 * The teal bar at the top of a category listing: back, the heading, search,
 * and the trail that leads here.
 *
 * The canvas draws the search control as a button that does nothing; here it
 * is a link to the search page, which is where a customer who taps it
 * expects to go. The back control is a link too, not `history.back()`: a
 * customer who arrived from a search engine has no history to go back to, and
 * the parent category is where «back» means in a catalogue.
 */
export function CategoryHeader({
  title,
  backHref,
  crumbs,
}: {
  readonly title: string;
  readonly backHref: string;
  readonly crumbs: readonly Crumb[];
}) {
  return (
    <header className="zn-cathead">
      <div className="zn-cathead__row">
        <Link className="zn-cathead__btn" href={backHref} aria-label="بازگشت">
          <ArrowRightIcon size={20} />
        </Link>
        <h1 className="zn-cathead__title">{title}</h1>
        <Link className="zn-cathead__btn" href={routes.search()} aria-label="جست‌وجو">
          <SearchIcon size={19} strokeWidth={1.8} />
        </Link>
      </div>

      <nav className="zn-crumbs" aria-label="مسیر صفحه">
        <ol className="zn-crumbs__list">
          {crumbs.map((crumb) => (
            <li className="zn-crumbs__item" key={crumb.label}>
              {crumb.href === undefined ? (
                <span className="zn-crumbs__here" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link className="zn-crumbs__link" href={crumb.href}>
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}
