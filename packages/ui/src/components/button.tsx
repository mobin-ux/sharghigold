import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { ButtonSize, ButtonVariant } from '../generated/component-contracts.js';

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export interface ButtonProps extends NativeButtonProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Stretch to the full inline size of the container. */
  readonly block?: boolean;
  /** Show a spinner and refuse input. Implies disabled. */
  readonly loading?: boolean;
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * `<Button>` — the design system's `.zn-btn`.
 *
 * `type` defaults to `button` rather than the HTML default of `submit`: a
 * button inside a form that was not meant to submit it is one of the easier
 * ways to charge a customer twice.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const className = [
    'zn-btn',
    `zn-btn--${variant}`,
    `zn-btn--${size}`,
    block ? 'zn-btn--block' : null,
    loading ? 'zn-btn--loading' : null,
  ]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <button
      // eslint-disable-next-line react/button-has-type -- narrowed by the prop type
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading ? true : undefined}
      {...rest}
    >
      {loading ? <span className="zn-btn__spin" aria-hidden="true" /> : null}
      {startIcon === undefined ? null : (
        <span className="zn-btn__icon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children === undefined ? null : <span>{children}</span>}
      {endIcon === undefined ? null : (
        <span className="zn-btn__icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
}
