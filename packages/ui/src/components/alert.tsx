import type { ReactNode } from 'react';

import type { AlertVariant } from '../generated/component-contracts.js';

export interface AlertProps {
  readonly children: ReactNode;
  /** Defaults to `info`, as in the design system. */
  readonly variant?: AlertVariant;
  readonly title?: ReactNode;
  /** Replaces the variant's own glyph. Hidden from assistive technology. */
  readonly icon?: ReactNode;
}

const ICONS: Record<AlertVariant, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  success: (
    <>
      <path d="M21.8 10A10 10 0 1 1 17 3.34" />
      <path d="m9 11 3 3L22 4" />
    </>
  ),
  warning: (
    <>
      <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  danger: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
};

/**
 * `<Alert>` — a message about the thing it sits beside.
 *
 * The role follows the variant, as in the design system: `alert` for danger,
 * which interrupts a screen reader, and `status` for everything else, which
 * waits for a pause. Getting that backwards either buries a refusal or talks
 * over the customer while they type.
 *
 * A Server Component. The design system's version injects its stylesheet from
 * JavaScript on first render; here the rules ship in `components.css`, so the
 * markup arrives already styled and needs no client boundary.
 */
export function Alert({ children, variant = 'info', title, icon }: AlertProps) {
  return (
    <div
      className={`zn-alert zn-alert--${variant}`}
      role={variant === 'danger' ? 'alert' : 'status'}
    >
      <span className="zn-alert__icon" aria-hidden="true">
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[variant]}
          </svg>
        )}
      </span>
      <div className="zn-alert__body">
        {title === undefined ? null : <div className="zn-alert__title">{title}</div>}
        <div className="zn-alert__msg">{children}</div>
      </div>
    </div>
  );
}
