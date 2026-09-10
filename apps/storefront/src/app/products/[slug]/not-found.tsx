import Link from 'next/link';

/**
 * A product that does not exist, or no longer does.
 *
 * An ordinary answer rather than an error: pieces sell out and get withdrawn,
 * and the links to them stay in messages and search results for years. So it
 * says what happened and offers the way onward instead of apologising for a
 * failure that did not occur.
 */
export default function ProductNotFound() {
  return (
    <div className="zn-shell zn-shell--message">
      <div className="zn-pagemsg">
        <h1 className="zn-pagemsg__title">این کالا در دسترس نیست</h1>
        <p className="zn-pagemsg__body">
          ممکن است فروخته شده یا از فهرست خارج شده باشد. کالاهای مشابه را در دسته‌بندی‌ها ببینید.
        </p>
        <Link className="zn-btn zn-btn--gold zn-btn--md" href="/categories">
          مشاهده دسته‌بندی‌ها
        </Link>
      </div>
    </div>
  );
}
