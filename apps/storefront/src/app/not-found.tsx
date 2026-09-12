import Link from 'next/link';

import { BottomNav } from '@/components/bottom-nav';
import { routes } from '@/lib/routes';

/**
 * The 404.
 *
 * Until this file existed, every unknown URL — and there were fourteen live
 * links to unknown URLs, including one in the tab bar — rendered the
 * framework's own page: «This page could not be found», in English, in a
 * left-to-right layout, with no header, no tab bar and no way back into the
 * shop. On a Persian storefront that reads as a broken site rather than a
 * missing page.
 *
 * It offers three ways on rather than one. A customer who reaches a 404 was
 * looking for something, and «go home» makes them start over; the search box
 * and the categories are where they were actually heading.
 */
export default function NotFound() {
  return (
    <div className="zn-shell zn-shell--message">
      <div className="zn-pagemsg">
        <h1 className="zn-pagemsg__title">این صفحه پیدا نشد</h1>
        <p className="zn-pagemsg__body">
          نشانی‌ای که باز کردید وجود ندارد یا کالای آن از فهرست برداشته شده است.
        </p>

        <div className="zn-pagemsg__actions">
          <Link className="zn-pagemsg__primary" href={routes.categories()}>
            مرور دسته‌بندی‌ها
          </Link>
          <Link className="zn-pagemsg__secondary" href={routes.products()}>
            همه محصولات
          </Link>
          <Link className="zn-pagemsg__secondary" href={routes.home()}>
            صفحه اصلی
          </Link>
        </div>

        <p className="zn-pagemsg__code">کد خطا: ۴۰۴</p>
      </div>

      <BottomNav />
    </div>
  );
}
