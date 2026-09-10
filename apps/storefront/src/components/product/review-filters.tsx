import Link from 'next/link';
import type { ReviewFilter, ReviewSort } from '@sharghigold/contracts';

import { persianCount } from '@/lib/product-view';

/**
 * The filter chips and the sort control above the review list.
 *
 * Links, not buttons. The filter and the sort are query parameters that the
 * server parses into a closed set and applies before anything is sent, so the
 * control that changes them is a control that changes the URL — which makes
 * every view shareable, crawlable, and reachable with JavaScript disabled.
 * The canvas filters in the browser over a list it has already sent in full;
 * that puts every hidden review in the page source and makes «filtered» a
 * description of what is painted rather than of what was sent.
 *
 * `aria-pressed` would be wrong on a link. These say where they lead, and the
 * current one is marked with `aria-current`.
 */

const FILTERS: readonly { readonly id: ReviewFilter; readonly label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'five-star', label: '۵ ستاره' },
  { id: 'with-photos', label: 'دارای عکس' },
  { id: 'critical', label: 'نقدهای منفی' },
  { id: 'answered', label: 'پاسخ زرنما' },
];

const SORTS: readonly { readonly id: ReviewSort; readonly label: string }[] = [
  { id: 'helpful', label: 'مفیدترین' },
  { id: 'newest', label: 'تازه‌ترین' },
];

/** Builds a reviews URL, dropping parameters that are already the default. */
export function reviewsHref(
  slug: string,
  { filter, sort, limit }: { filter: ReviewFilter; sort: ReviewSort; limit?: number },
): string {
  const query = new URLSearchParams();
  if (filter !== 'all') query.set('filter', filter);
  if (sort !== 'helpful') query.set('sort', sort);
  if (limit !== undefined) query.set('limit', String(limit));

  const search = query.toString();
  return `/products/${slug}/reviews${search === '' ? '' : `?${search}`}`;
}

export function ReviewFilters({
  slug,
  filter,
  sort,
  shown,
  total,
}: {
  readonly slug: string;
  readonly filter: ReviewFilter;
  readonly sort: ReviewSort;
  readonly shown: number;
  readonly total: number;
}) {
  return (
    <div className="zn-rvbar">
      <nav className="zn-rvbar__filters" aria-label="فیلتر دیدگاه‌ها">
        {FILTERS.map((option) => (
          <Link
            className={`zn-rvchip${option.id === filter ? ' zn-rvchip--on' : ''}`}
            key={option.id}
            href={reviewsHref(slug, { filter: option.id, sort })}
            aria-current={option.id === filter ? 'true' : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="zn-rvbar__meta">
        <p className="zn-rvbar__count" role="status">
          {total === 0
            ? 'بدون نتیجه'
            : `نمایش ${persianCount(shown)} از ${persianCount(total)} دیدگاه`}
        </p>

        <nav className="zn-rvbar__sorts" aria-label="ترتیب دیدگاه‌ها">
          {SORTS.map((option) => (
            <Link
              className={`zn-rvsort${option.id === sort ? ' zn-rvsort--on' : ''}`}
              key={option.id}
              href={reviewsHref(slug, { filter, sort: option.id })}
              aria-current={option.id === sort ? 'true' : undefined}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
