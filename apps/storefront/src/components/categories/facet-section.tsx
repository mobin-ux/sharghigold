'use client';

import { useId, useState } from 'react';
import type { FacetGroup } from '@sharghigold/contracts';

import { FacetTile } from '@/components/categories/facet-tile';
import { ChevronDownIcon } from '@/components/icons';

/**
 * One collapsible group of facet tiles.
 *
 * Open by default, as the canvas has it: a customer arrives to see the whole
 * category laid out, not to a stack of closed headings they have to work
 * through. Collapsing is there to get a long category out of the way, so the
 * state is per-group and lives here rather than being lifted — nothing else
 * needs to know which sections are open.
 *
 * The tiles stay in the DOM when collapsed and are hidden with `hidden`. That
 * keeps in-page find working and means the browser, not React, pays for the
 * toggle.
 */
export function FacetSection({ group }: { readonly group: FacetGroup }) {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const headingId = useId();

  return (
    <div className="zn-facet">
      <h2 className="zn-facet__heading">
        <button
          className="zn-facet__toggle"
          type="button"
          id={headingId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{group.title}</span>
          <span className={`zn-facet__chevron${open ? ' zn-facet__chevron--open' : ''}`}>
            <ChevronDownIcon />
          </span>
        </button>
      </h2>

      <div className="zn-facet__grid" id={panelId} aria-labelledby={headingId} hidden={!open}>
        {group.tiles.map((tile) => (
          <FacetTile key={`${tile.slug}-${tile.label}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}
