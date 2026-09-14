'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type ReactNode } from 'react';
import type { Karat, ListingQuery } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  countLabel,
  karatLabel,
  listingHref,
  PRICE_SLIDER,
  rialsToSlider,
  sameWeight,
  sliderAmountLabel,
  sliderToRials,
  weightOf,
  type ListingFacets,
  type WeightBounds,
} from '@/lib/listing-view';
import { routes } from '@/lib/routes';

/** What the sheet has selected so far, before it is applied. */
interface Draft {
  /** The sub-type path, or null for the whole category. */
  readonly modelPath: string | null;
  readonly weight: WeightBounds | null;
  readonly karat: Karat | null;
  /** Millions of toman; the top of the range means no cap. */
  readonly slider: number;
}

function draftFrom(basePath: string, query: ListingQuery, facets: ListingFacets): Draft {
  return {
    modelPath: facets.models.some((model) => model.basePath === basePath) ? basePath : null,
    weight: weightOf(query),
    karat: query.karat ?? null,
    slider: rialsToSlider(query.maxPriceRials),
  };
}

const EMPTY_DRAFT: Draft = { modelPath: null, weight: null, karat: null, slider: PRICE_SLIDER.max };

/**
 * The filter sheet.
 *
 * It keeps a draft while it is open and applies it as one link, «نمایش ۱۲
 * کالا». Applying each tap immediately, as the canvas does, would reload the
 * grid behind the sheet on every chip and push a history entry per tap.
 *
 * The count on that button is the draft's, not the page's. It comes from
 * `/api/products/count` because it depends on prices, which only the server
 * can compute; while it is on its way the button says «نمایش نتایج» rather
 * than showing a number that belongs to the previous selection.
 *
 * Choosing a model changes the path, not a parameter — `/categories/earrings-drop`
 * is that model's page — so the chips are single-choice, like the pages they
 * lead to.
 */
export function FilterSheet({
  open,
  onClose,
  basePath,
  query,
  total,
  facets,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly basePath: string;
  readonly query: ListingQuery;
  readonly total: number;
  readonly facets: ListingFacets;
}) {
  // Starts from what the page is showing. The toolbar remounts the sheet each
  // time it opens, so an abandoned draft never survives a close.
  const [draft, setDraft] = useState<Draft>(() => draftFrom(basePath, query, facets));
  // The last count the server gave, and for which destination.
  const [fetched, setFetched] = useState<{ readonly href: string; readonly total: number } | null>(
    null,
  );

  const path = draft.modelPath ?? facets.categoryPath ?? basePath;
  const href = listingHref(path, query, {
    minWeightMg: draft.weight?.minWeightMg ?? null,
    maxWeightMg: draft.weight?.maxWeightMg ?? null,
    karat: draft.karat,
    maxPriceRials: sliderToRials(draft.slider),
    page: 1,
  });
  const unchanged = href === listingHref(basePath, query, { page: 1 });
  // Derived, never stored: a count that belongs to an earlier selection is
  // not shown while the answer for this one is on its way.
  const count = unchanged ? total : fetched?.href === href ? fetched.total : null;

  useEffect(() => {
    if (!open || unchanged) return undefined;

    const controller = new AbortController();
    const slug =
      facets.models.find((model) => model.basePath === path)?.slug ?? facets.categorySlug;
    const search = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';

    // Debounced, so dragging the slider asks once where it stops rather than
    // once per step it passes.
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(routes.apiProductCount(slug, search), {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = (await response.json()) as { readonly total?: unknown };
        if (typeof body.total === 'number') setFetched({ href, total: body.total });
      } catch {
        // Aborted by the next change, or offline: the button keeps its
        // number-less label, which is still true.
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, unchanged, href, path, facets]);

  const set = (patch: Partial<Draft>) => setDraft((previous) => ({ ...previous, ...patch }));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="فیلترها"
      body="flush"
      capped
      footer={
        <>
          <button
            className="zn-sheetbtn zn-sheetbtn--ghost"
            type="button"
            onClick={() => setDraft(EMPTY_DRAFT)}
          >
            حذف همه
          </button>
          <Link
            className="zn-sheetbtn zn-sheetbtn--apply"
            href={href}
            onClick={onClose}
            scroll={false}
          >
            {count === null ? 'نمایش نتایج' : `نمایش ${countLabel(count)}`}
          </Link>
        </>
      }
    >
      {facets.models.length === 0 ? null : (
        <FacetGroup title="مدل">
          {facets.models.map((model) => (
            <Choice
              key={model.slug}
              label={model.label}
              on={draft.modelPath === model.basePath}
              onToggle={(on) => set({ modelPath: on ? model.basePath : null })}
            />
          ))}
        </FacetGroup>
      )}

      {facets.weightBands.length === 0 ? null : (
        <FacetGroup title="بازه وزنی">
          {facets.weightBands.map((band) => (
            <Choice
              key={band.label}
              label={band.label}
              on={sameWeight(draft.weight, band)}
              onToggle={(on) =>
                set({
                  weight: on
                    ? { minWeightMg: band.minWeightMg, maxWeightMg: band.maxWeightMg }
                    : null,
                })
              }
            />
          ))}
        </FacetGroup>
      )}

      <FacetGroup title="عیار">
        {facets.karats.map((karat) => (
          <Choice
            key={karat}
            label={karatLabel(karat)}
            on={draft.karat === karat}
            onToggle={(on) => set({ karat: on ? karat : null })}
          />
        ))}
      </FacetGroup>

      <PriceSlider value={draft.slider} onChange={(slider) => set({ slider })} />
    </BottomSheet>
  );
}

function FacetGroup({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  const id = useId();

  return (
    <div className="zn-facet" role="group" aria-labelledby={id}>
      <span className="zn-facet__title" id={id}>
        {title}
      </span>
      <div className="zn-facet__options">{children}</div>
    </div>
  );
}

/** A chip that is on or off. Tapping an «on» chip turns it off. */
function Choice({
  label,
  on,
  onToggle,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly onToggle: (on: boolean) => void;
}) {
  return (
    <button
      className={`zn-chip zn-chip--facet${on ? ' zn-chip--on' : ''}`}
      type="button"
      aria-pressed={on}
      onClick={() => onToggle(!on)}
    >
      {label}
    </button>
  );
}

function PriceSlider({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (millions: number) => void;
}) {
  const id = useId();
  const unlimited = value >= PRICE_SLIDER.max;

  return (
    <div className="zn-facet zn-facet--price">
      <label className="zn-facet__title zn-facet__title--tight" htmlFor={id}>
        حداکثر قیمت
      </label>
      <output className="zn-price-out" htmlFor={id}>
        {sliderAmountLabel(value)} <span className="zn-price-out__unit">تومان</span>
      </output>
      <input
        className="zn-range"
        id={id}
        type="range"
        min={PRICE_SLIDER.min}
        max={PRICE_SLIDER.max}
        step={PRICE_SLIDER.step}
        value={value}
        aria-valuetext={unlimited ? 'بدون محدودیت' : `${sliderAmountLabel(value)} تومان`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {/* In a right-to-left document a range input runs from its minimum at the
          right to its maximum at the left. The canvas labels the ends the other
          way round, so the thumb sat under «۱۰ میلیون» at the top of the range. */}
      <div className="zn-range__ends" aria-hidden="true">
        <span>{`${toPersianDigits(String(PRICE_SLIDER.min))} میلیون`}</span>
        <span>{`${toPersianDigits(String(PRICE_SLIDER.max))} میلیون`}</span>
      </div>
    </div>
  );
}
