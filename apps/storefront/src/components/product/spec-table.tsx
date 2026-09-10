'use client';

import { useState } from 'react';
import type { ProductSpec } from '@sharghigold/contracts';

import { ChevronDownIcon } from '@/components/icons';

/** How many rows show before «مشاهده همه مشخصات». */
const COLLAPSED_ROWS = 4;

/**
 * «مشخصات کالا» — a description list, collapsed to the first few rows.
 *
 * A `<dl>` rather than a grid of spans: each row is a term and its
 * description, which is exactly what the element is for, and it is what lets a
 * screen reader read «عیار: ۱۸ عیار» as a pair instead of two loose strings.
 *
 * The hidden rows are rendered and hidden rather than left out, so the control
 * can say how many there are and expanding does not reflow the page from
 * scratch.
 */
export function SpecTable({ specs }: { readonly specs: readonly ProductSpec[] }) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = specs.length > COLLAPSED_ROWS;

  return (
    <section className="zn-specs" aria-labelledby="specs">
      <h2 className="zn-specs__title" id="specs">
        مشخصات کالا
      </h2>

      <dl className="zn-specs__list">
        {specs.map((spec, index) => (
          <div
            className="zn-specs__row"
            key={spec.key}
            hidden={collapsible && !expanded && index >= COLLAPSED_ROWS}
          >
            <dt className="zn-specs__key">{spec.key}</dt>
            <dd className="zn-specs__value">{spec.value}</dd>
          </div>
        ))}
      </dl>

      {collapsible ? (
        <button
          className="zn-specs__toggle"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((was) => !was)}
        >
          {expanded ? 'بستن مشخصات' : 'مشاهده همه مشخصات'}
          <span className={`zn-specs__chev${expanded ? ' zn-specs__chev--open' : ''}`}>
            <ChevronDownIcon size={15} />
          </span>
        </button>
      ) : null}
    </section>
  );
}
