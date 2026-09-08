import type { ReactElement } from 'react';

/**
 * Line icons, taken from the design canvas.
 *
 * All of them are decorative: they sit beside a text label or inside a control
 * that already has an accessible name. So each one is `aria-hidden` at source
 * rather than at every call site — an icon that announces itself as "image"
 * next to the word it illustrates is noise, and one that announces nothing at
 * all inside a bare button is a defect. Neither is left to the caller.
 */
type IconProps = {
  readonly size?: number;
  /**
   * Overrides the 1.6 default. The canvas draws the same glyph at different
   * weights depending on how small it is — a 15px chevron is stroked at 2.2 so
   * it keeps the presence a 22px one has at 1.6.
   */
  readonly strokeWidth?: number;
};

function Line({
  size = 22,
  strokeWidth = 1.6,
  children,
}: IconProps & { readonly children: ReactElement | readonly ReactElement[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Line {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4-5.4 7.5-5.4S18.1 16.4 19.5 20" />
    </Line>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Line {...props}>
      <circle cx="9" cy="20" r="1.1" />
      <circle cx="18" cy="20" r="1.1" />
      <path d="M2.5 3h2.2l2.5 11.4a1.7 1.7 0 0 0 1.7 1.3h8.4a1.7 1.7 0 0 0 1.7-1.3L20.6 7H5.6" />
    </Line>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Line {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </Line>
  );
}

/** Points toward the start of the line in RTL — i.e. «more this way». */
export function ChevronIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="m14 6-6 6 6 6" />
    </Line>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M19 12H5.5" />
      <path d="m11.5 5.5-6 6.5 6 6.5" />
    </Line>
  );
}

/** Points along the reading direction in RTL — i.e. «back», toward the start. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Line size={19} strokeWidth={1.9} {...props}>
      <path d="m14.5 5 7 7-7 7" />
      <path d="M21.5 12H3" />
    </Line>
  );
}

/** The disclosure chevron on an accordion header. Rotated in CSS when open. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Line size={17} strokeWidth={2} {...props}>
      <path d="m6 9 6 6 6-6" />
    </Line>
  );
}

/** A payment card, as used on the instalment banner. */
export function BankCardIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.8} {...props}>
      <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.4" />
      <path d="M2.6 10h18.8" />
    </Line>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="m5 12.5 4.4 4.3L19 7.2" />
    </Line>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 2.8 4.8 5.6v5.6c0 4.4 3 8.1 7.2 9.4 4.2-1.3 7.2-5 7.2-9.4V5.6Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </Line>
  );
}

export function InvoiceIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M5.5 3h13v18l-2.2-1.6-2.2 1.6-2.1-1.6-2.2 1.6-2.1-1.6L5.5 21Z" />
      <path d="M9 8h6M9 12h6" />
    </Line>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M2.8 6.5h10.4v9.8H2.8Z" />
      <path d="M13.2 9.6h3.6l2.6 2.9v3.8h-6.2Z" />
      <circle cx="7" cy="18.2" r="1.7" />
      <circle cx="16.6" cy="18.2" r="1.7" />
    </Line>
  );
}

export function ReturnIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 3.6v4.6h-4.6" />
    </Line>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M4 5.5c0 8 6.5 14.5 14.5 14.5v-3.4l-4-1.7-2 2a11.5 11.5 0 0 1-5.4-5.4l2-2L7.4 5.5Z" />
    </Line>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 21c4.2-4.4 6.3-7.7 6.3-10.5a6.3 6.3 0 1 0-12.6 0C5.7 13.3 7.8 16.6 12 21Z" />
      <circle cx="12" cy="10.4" r="2.2" />
    </Line>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Line {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4V12l3 1.8" />
    </Line>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M3.5 10.4 12 3.6l8.5 6.8V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" />
    </Line>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M4 4.5h6v6H4zM14 4.5h6v6h-6zM4 13.5h6v6H4zM14 13.5h6v6h-6z" />
    </Line>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M2.6 5.4h18.8a1.6 1.6 0 0 1 1.6 1.6v10a1.6 1.6 0 0 1-1.6 1.6H2.6A1.6 1.6 0 0 1 1 17V7a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M1 10h22" />
      <path d="M5 14.6h3.6" />
    </Line>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Line {...props}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.8" cy="7.2" r="0.9" />
    </Line>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M21 4.4 2.9 11.3l5 1.7 1.8 5.4 2.7-3.3 4.4 3.2Z" />
      <path d="m7.9 13 8.6-5.6-5.9 7.7" />
    </Line>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M20.4 11.7A8.4 8.4 0 0 1 7.9 19l-4.5 1.2L4.7 16A8.4 8.4 0 1 1 20.4 11.7Z" />
      <path d="M9.3 8.6c.3 2.6 2.4 4.7 5 5l.9-1.4 1.7.7-.4 1.6c-2.9.4-6.9-3-7.7-6.5l1.6-.4Z" />
    </Line>
  );
}
