import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { IconButtonSize, IconButtonVariant } from '../generated/component-contracts.js';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-label' | 'title' | 'type'
>;

export interface IconButtonProps extends NativeButtonProps {
  readonly icon: ReactNode;
  /**
   * Accessible name. Required, not optional: the icon is hidden from assistive
   * technology, so without this the control announces as nothing at all.
   */
  readonly label: string;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
}

/** `<IconButton>` — the design system's `.zn-iconbtn`. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  ...rest
}: IconButtonProps) {
  const className = [
    'zn-iconbtn',
    `zn-iconbtn--${size}`,
    variant === 'ghost' ? null : `zn-iconbtn--${variant}`,
  ]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{ display: 'inline-flex', width: 'var(--icon-md)', height: 'var(--icon-md)' }}
      >
        {icon}
      </span>
    </button>
  );
}
