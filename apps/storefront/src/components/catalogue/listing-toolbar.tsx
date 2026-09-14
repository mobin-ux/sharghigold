'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ListingQuery } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';

import { BottomSheet } from '@/components/bottom-sheet';
import { FilterIcon, SortIcon } from '@/components/icons';
import {
  listingHref,
  QUICK_FILTERS,
  SORT_LABEL,
  SORT_OPTIONS,
  type ListingFacets,
} from '@/lib/listing-view';

import { FilterSheet } from './filter-sheet';

type OpenSheet = 'filters' | 'sort' | null;

/**
 * The filter and sort buttons, and the quick-filter chips under them.
 *
 * A client island only because the two sheets open in place. Everything the
 * sheets and the chips *do* is a link to the same page with parameters changed,
 * built by `listingHref` — the island holds whether a sheet is open, and the
 * filter sheet's draft while it is, and nothing else.
 *
 * `filterCount` arrives from the server rather than being recounted here, so
 * the badge and the «حذف فیلترها» link beside the count always agree.
 */
export function ListingToolbar({
  basePath,
  query,
  total,
  filterCount,
  facets,
  sticky = false,
}: {
  /** The path this listing lives at, without the query. */
  readonly basePath: string;
  readonly query: ListingQuery;
  readonly total: number;
  readonly filterCount: number;
  readonly facets: ListingFacets;
  /** Stick under the category header while the grid scrolls. */
  readonly sticky?: boolean;
}) {
  const [open, setOpen] = useState<OpenSheet>(null);
  // Bumped on every opening of the filter sheet and used as its key, so each
  // opening starts from the page's filters rather than a draft left behind.
  const [filterSession, setFilterSession] = useState(0);
  const close = () => setOpen(null);
  const openFilters = () => {
    setFilterSession((session) => session + 1);
    setOpen('filters');
  };

  return (
    <div className={`zn-listtools${sticky ? ' zn-listtools--sticky' : ''}`}>
      <div className="zn-listtools__row">
        <button className="zn-listtools__btn" type="button" onClick={openFilters}>
          <FilterIcon />
          فیلترها
          {filterCount === 0 ? null : (
            <span className="zn-listtools__badge">
              <span className="sr-only">، </span>
              {toPersianDigits(String(filterCount))}
              <span className="sr-only"> فیلتر فعال</span>
            </span>
          )}
        </button>

        <button className="zn-listtools__btn" type="button" onClick={() => setOpen('sort')}>
          <SortIcon />
          <span className="sr-only">مرتب‌سازی: </span>
          {SORT_LABEL[query.sort]}
        </button>
      </div>

      <nav className="zn-quick" aria-label="فیلترهای سریع">
        {QUICK_FILTERS.map(({ field, label }) => {
          const on = query[field];

          return (
            <Link
              className={`zn-chip${on ? ' zn-chip--on' : ''}`}
              key={field}
              href={listingHref(basePath, query, { [field]: !on, page: 1 })}
              aria-current={on ? 'true' : undefined}
              scroll={false}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <FilterSheet
        key={filterSession}
        open={open === 'filters'}
        onClose={close}
        basePath={basePath}
        query={query}
        total={total}
        facets={facets}
      />

      <BottomSheet open={open === 'sort'} onClose={close} title="مرتب‌سازی" body="list">
        {SORT_OPTIONS.map((sort) => {
          const current = sort === query.sort;

          return (
            <Link
              className={`zn-sortopt${current ? ' zn-sortopt--on' : ''}`}
              key={sort}
              href={listingHref(basePath, query, { sort, page: 1 })}
              aria-current={current ? 'true' : undefined}
              onClick={close}
              scroll={false}
            >
              <span>{SORT_LABEL[sort]}</span>
              {current ? (
                <span className="zn-sortopt__check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </Link>
          );
        })}
      </BottomSheet>
    </div>
  );
}
