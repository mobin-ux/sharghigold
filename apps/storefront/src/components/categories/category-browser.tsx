'use client';

import { useCallback, useId, useRef, useState } from 'react';
import type { CategoryNavigation } from '@sharghigold/contracts';

import { CategoryRail } from '@/components/categories/category-rail';
import { CategoryPanelHead, InstallmentBanner } from '@/components/categories/category-panel-head';
import { FacetSection } from '@/components/categories/facet-section';

/**
 * The two-column body of the category browser: rail on the outside edge,
 * facets on the inside.
 *
 * The whole catalogue arrives as one prop and switching categories is local
 * state, so a tap repaints the panel immediately instead of making a round
 * trip. That is the interaction the canvas designs for, and a browser you have
 * to wait on is a different, worse thing.
 *
 * The chosen category is mirrored into `?category=` so the view can be
 * bookmarked, shared and restored. `replaceState` rather than a router push:
 * flicking through eight categories should not bury the page a customer
 * arrived from under eight history entries.
 */
export function CategoryBrowser({
  navigation,
  initialSlug,
}: {
  readonly navigation: CategoryNavigation;
  readonly initialSlug: string;
}) {
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const panelRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();

  const panelId = `${idPrefix}-panel`;
  const tabId = useCallback((slug: string) => `${idPrefix}-tab-${slug}`, [idPrefix]);

  const active =
    navigation.categories.find((category) => category.slug === activeSlug) ??
    navigation.categories[0];

  const onSelect = useCallback((slug: string) => {
    setActiveSlug(slug);

    // Back to the top of the new category — otherwise the panel keeps the
    // previous category's scroll position and opens halfway down a list the
    // customer has not seen.
    panelRef.current?.scrollTo({ top: 0 });

    const url = new URL(window.location.href);
    url.searchParams.set('category', slug);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  // `selectCategory` on the server guarantees at least one category, so this
  // only fires if the catalogue emptied between render and hydration.
  if (active === undefined) return null;

  return (
    <div className="zn-catbrowse">
      <div
        className="zn-catpanel"
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active.slug)}
        tabIndex={0}
        ref={panelRef}
      >
        <CategoryPanelHead category={active} />

        {active.installmentEligible ? <InstallmentBanner category={active} /> : null}

        {active.groups.map((group) => (
          <FacetSection key={`${active.slug}-${group.kind}-${group.title}`} group={group} />
        ))}

        <div className="zn-catpanel__tail" />
      </div>

      <CategoryRail
        categories={navigation.categories}
        activeSlug={active.slug}
        onSelect={onSelect}
        tabId={tabId}
        panelId={panelId}
      />
    </div>
  );
}
