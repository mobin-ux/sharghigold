import type { ReactNode } from 'react';

import type { BadgeVariant } from '../generated/component-contracts.js';

export interface BadgeProps {
  readonly children: ReactNode;
  /** Defaults to `neutral`, as in the design system. */
  readonly variant?: BadgeVariant;
  /** Render a leading status dot in the current colour. */
  readonly dot?: boolean;
  /** Decorative leading icon. Hidden from assistive technology. */
  readonly icon?: ReactNode;
}

/**
 * `<Badge>` — a small status marker.
 *
 * Class names match `.zn-badge` in the generated component stylesheet, so the
 * appearance is the design system's, not a reimplementation of it. The variant
 * type comes from the generated contract, so a variant the design system does
 * not define will not compile.
 */
export function Badge({ children, variant = 'neutral', dot = false, icon }: BadgeProps) {
  const className = ['zn-badge', `zn-badge--${variant}`, dot ? 'zn-badge--dot' : null]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <span className={className}>
      {icon === undefined ? null : <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
