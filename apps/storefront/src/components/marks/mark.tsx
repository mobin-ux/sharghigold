import type { ReactElement } from 'react';

import { MARKS } from './registry';
import { FALLBACK_MARK, type MarkPath } from './paths';

/**
 * Renders one named catalogue mark.
 *
 * Always decorative: every mark in this system sits directly above its own
 * label, so announcing it would make a screen reader read the category name
 * twice. It is hidden from the accessibility tree, and callers are expected to
 * provide the text.
 */
export function Mark({
  icon,
  size = 34,
}: {
  readonly icon: string;
  readonly size?: number;
}): ReactElement {
  const paths = MARKS[icon] ?? FALLBACK_MARK;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((path, index) => (
        // A mark's path list is a fixed constant — the shapes are layers in a
        // drawing, never reordered, filtered or keyed by anything of their
        // own. Position is genuinely their identity here.
        // oxlint-disable-next-line no-array-index-key
        <MarkShape key={index} path={path} />
      ))}
    </svg>
  );
}

function MarkShape({ path }: { readonly path: MarkPath }): ReactElement {
  const shape = (
    <path
      d={path.d}
      fill={path.fill}
      {...(path.evenOdd === true
        ? { fillRule: 'evenodd' as const, clipRule: 'evenodd' as const }
        : {})}
    />
  );

  // Shapes drawn around the origin — teardrops and hearts — are positioned by
  // a transform, which needs a group to hang on.
  return path.transform === undefined ? shape : <g transform={path.transform}>{shape}</g>;
}

/**
 * The neutral mark for an «همه کالاها» tile.
 *
 * Stroked rather than filled, and outside the registry, because it is not a
 * product illustration: it means «no narrowing», so it deliberately reads as
 * chrome rather than as another category to choose between.
 */
export function AllProductsMark(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
