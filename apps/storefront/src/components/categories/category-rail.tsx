'use client';

import { useRef, type KeyboardEvent } from 'react';
import type { CategoryNavigationEntry } from '@sharghigold/contracts';

import { Mark } from '@/components/marks/mark';

/**
 * The vertical strip of top-level categories.
 *
 * This is a tab list, not a set of links: choosing a category swaps the panel
 * beside it without leaving the page. The canvas marks the active item with
 * `aria-current`, which describes *location* — it would tell a screen-reader
 * user this is the page they are on, when in fact it is the one option of
 * eight that is showing. `role="tab"` with `aria-selected` says what is
 * actually true, and brings the keyboard behaviour that goes with it: arrows
 * move between categories, Home and End jump to the ends, and Tab leaves the
 * list rather than walking through all eight.
 *
 * Selection follows focus, which is the right choice when switching is free —
 * there is no request behind it, so making the user press Enter as well would
 * be ceremony.
 */
export function CategoryRail({
  categories,
  activeSlug,
  onSelect,
  tabId,
  panelId,
}: {
  readonly categories: readonly CategoryNavigationEntry[];
  readonly activeSlug: string;
  readonly onSelect: (slug: string) => void;
  readonly tabId: (slug: string) => string;
  readonly panelId: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const clamped = (index + categories.length) % categories.length;
    const target = categories[clamped];
    if (target === undefined) return;

    onSelect(target.slug);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(target.slug))}`)
      ?.focus();
  };

  // On the tabs rather than the list: the tablist itself is not focusable —
  // the APG puts one tab stop on the selected tab — so a handler on the
  // container would only ever fire through bubbling anyway.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = categories.findIndex((category) => category.slug === activeSlug);
    if (current === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusTab(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusTab(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(categories.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="zn-catrail"
      role="tablist"
      aria-orientation="vertical"
      aria-label="دسته‌بندی‌ها"
      ref={listRef}
    >
      {categories.map((category) => {
        const selected = category.slug === activeSlug;

        return (
          <button
            key={category.slug}
            className={`zn-catrail__item${selected ? ' zn-catrail__item--on' : ''}`}
            type="button"
            role="tab"
            id={tabId(category.slug)}
            aria-selected={selected}
            aria-controls={panelId}
            // Roving tabindex: one stop for the whole list, then arrows.
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(category.slug)}
            onKeyDown={onKeyDown}
          >
            <span className="zn-catrail__bar" />
            <span className="zn-catrail__icon">
              <Mark icon={category.icon} size={26} />
            </span>
            <span>{category.title}</span>
          </button>
        );
      })}
      <div className="zn-catrail__tail" />
    </div>
  );
}
