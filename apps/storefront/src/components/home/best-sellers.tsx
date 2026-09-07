'use client';

import { useState } from 'react';

import { toPersianDigits } from '@sharghigold/ui';

import { ProductTile } from '@/components/home/product-tile';
import type { ProductView } from '@/lib/catalogue';

/**
 * Best sellers, with category filter chips.
 *
 * The filtering happens in the browser because the whole set is already on the
 * page — a round trip to hide four cards would be slower and would lose the
 * scroll position. The chips are `role="tab"`-free on purpose: they are not
 * tabs, they are a single-select filter, so they are buttons with
 * `aria-pressed` and the grid is a labelled live region that says how many
 * results are showing.
 *
 * The full unfiltered list is what the server renders, so a crawler and a
 * visitor without JavaScript both see every product rather than one slice.
 */
export function BestSellers({
  products,
  filters,
}: {
  readonly products: readonly ProductView[];
  readonly filters: readonly string[];
}) {
  const [active, setActive] = useState<string>(filters[0] ?? 'همه');

  const shown =
    active === (filters[0] ?? 'همه')
      ? products
      : products.filter((product) => product.category === active);

  return (
    <>
      <div className="zn-chips" role="group" aria-label="فیلتر دسته‌بندی">
        {filters.map((filter) => (
          <button
            className={`zn-chip${filter === active ? ' zn-chip--on' : ''}`}
            key={filter}
            type="button"
            aria-pressed={filter === active}
            onClick={() => setActive(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Changing a filter changes the grid silently for a sighted user, who
          can see it happen. This says the same thing to someone who cannot. */}
      <p className="sr-only" role="status">
        {`${toPersianDigits(shown.length)} محصول`}
      </p>

      {shown.length === 0 ? (
        <p className="zn-empty">در این دسته هنوز محصولی ثبت نشده است.</p>
      ) : (
        <ul className="zn-grid">
          {shown.map((product) => (
            <li key={product.slug}>
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
