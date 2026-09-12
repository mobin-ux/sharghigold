import Link from 'next/link';

import { CartBadge } from '@/components/cart-badge';
import { CartIcon, SearchIcon, UserIcon } from '@/components/icons';
import { BRAND } from '@/config/brand';
import { routes } from '@/lib/routes';

/**
 * The sticky teal header: wordmark, account, basket, search.
 *
 * The search box is a real `<form method="get">` pointed at the search page.
 * That is not a simplification pending JavaScript — it is the whole feature:
 * it submits on Enter, works before hydration, is bookmarkable, and leaves the
 * query in the URL where a crawler and the browser's own history can see it.
 * A client-side handler can be layered on later without changing any of that.
 *
 * The basket count is a client island (`CartBadge`), not part of this server
 * component. Rendering a count here would mean reading the customer's session
 * on every request, which makes the homepage uncacheable for everyone.
 */
export function SiteHeader() {
  return (
    <header className="zn-head">
      <div className="zn-head__row">
        <Link className="zn-head__brand" href={routes.home()}>
          <span className="zn-head__wordmark">{BRAND.name}</span>
          <span className="zn-head__tagline">{BRAND.tagline}</span>
        </Link>

        <Link className="zn-head__action" href={routes.account()} aria-label="حساب کاربری">
          <UserIcon size={21} />
        </Link>
        <Link
          className="zn-head__action zn-head__action--cart"
          href={routes.cart()}
          aria-label="سبد خرید"
        >
          <CartIcon size={21} />
          <CartBadge />
        </Link>
      </div>

      <form className="zn-head__search" action="/search" method="get" role="search">
        <label className="sr-only" htmlFor="site-search">
          جست‌وجو در محصولات
        </label>
        <span className="zn-head__search-icon">
          <SearchIcon size={18} />
        </span>
        <input
          className="zn-head__search-input"
          id="site-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="جست‌وجو در گوشواره، گردنبند، النگو…"
        />
      </form>
    </header>
  );
}
