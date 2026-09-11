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
  fill = 'none',
  children,
}: IconProps & {
  /** Only the heart uses this: outlined until it is on, then solid. */
  readonly fill?: string;
  readonly children: ReactElement | readonly ReactElement[];
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
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

/* -------------------------------------------------------------------------- */
/* Product page                                                               */
/* -------------------------------------------------------------------------- */

/** Three nodes and two connectors — the share control in the product header. */
export function ShareIcon(props: IconProps) {
  return (
    <Line size={19} strokeWidth={1.7} {...props}>
      <circle cx="18" cy="5.4" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="18.6" r="2.6" />
      <path d="m8.3 10.7 7.4-4M8.3 13.3l7.4 4" />
    </Line>
  );
}

/**
 * The favourite control. Outlined until it is on, then filled with the same
 * colour it is stroked in — which is why `filled` sets `fill` to
 * `currentColor` rather than to a literal.
 */
export function HeartIcon({ filled = false, ...props }: IconProps & { readonly filled?: boolean }) {
  return (
    <Line size={20} strokeWidth={1.7} {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.4c-5.6-4-8.4-7-8.4-10.4a4.8 4.8 0 0 1 8.4-3.1 4.8 4.8 0 0 1 8.4 3.1c0 3.4-2.8 6.4-8.4 10.4Z" />
    </Line>
  );
}

/**
 * A rating star. Solid by default; the review form draws an empty one as an
 * outline in the same shape so the two never differ in size.
 */
export function StarIcon({
  size = 15,
  filled = true,
  strokeWidth = 1.4,
}: {
  readonly size?: number;
  readonly filled?: boolean;
  readonly strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'var(--gold-500)' : 'none'}
      stroke={filled ? 'var(--gold-500)' : 'var(--color-border-strong)'}
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 2.6 2.8 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3 6.2 20.6l1.3-6.6L2.6 9.5l6.6-.8Z" />
    </svg>
  );
}

/** Circled «i» — opens the size guide. */
export function InfoIcon(props: IconProps) {
  return (
    <Line size={14} strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.4M12 7.6h.01" />
    </Line>
  );
}

/**
 * The clock beside the price lock.
 *
 * A hair larger than {@link ClockIcon}, which the homepage canvas draws at
 * r 8.2. Both are kept rather than reconciled: they are two glyphs in the
 * design, and quietly changing one would move a pixel on a page that has
 * already been measured against it.
 */
export function LockClockIcon(props: IconProps) {
  return (
    <Line size={14} strokeWidth={1.9} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.8" />
    </Line>
  );
}

/**
 * The product page's tick.
 *
 * Ends a touch higher and further right than {@link CheckIcon}, which is the
 * homepage's. Same reasoning as the two clocks.
 */
export function TickIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Line>
  );
}

/** A van with one visible wheel — delivery, in lists and link rows. */
export function DeliveryIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <path d="M2.8 6.5h10.4v9.8H2.8Z" />
      <path d="M13.2 9.6h3.6l2.6 2.9v3.8h-6.2Z" />
      <circle cx="7" cy="16.5" r="1.9" />
    </Line>
  );
}

/** A shopfront — collection in person. */
export function StoreIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <path d="M4 9.5h16V20H4Z" />
      <path d="M3 9.5 5.5 4h13L21 9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Line>
  );
}

/** A bicycle — the dedicated Tehran courier. */
export function CourierIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <circle cx="5.5" cy="15.8" r="2.6" />
      <circle cx="18.5" cy="15.8" r="2.6" />
      <path d="M8 15.8h8l-2.6-8H10" />
    </Line>
  );
}

/** A speech bubble with a question mark — buyer questions. */
export function ChatIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <path d="M12 3.4a8.6 8.6 0 0 1 0 17.2H4.4l2-3.1A8.6 8.6 0 0 1 12 3.4Z" />
      <path d="M12 15.6h.01" />
      <path d="M9.8 9.6a2.3 2.3 0 1 1 3.4 2c-.7.4-1.2 1-1.2 1.8" />
    </Line>
  );
}

/** A ruler — the size guide. */
export function RulerIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <path d="M3 8.6h18v6.8H3Z" />
      <path d="M7 8.6v3M11 8.6v3M15 8.6v3M19 8.6v3" />
    </Line>
  );
}

/** A calculator — the instalment estimator. */
export function CalculatorIcon(props: IconProps) {
  return (
    <Line size={18} strokeWidth={1.7} {...props}>
      <path d="M6 2.8h12v18.4H6Z" />
      <path d="M9 7h6M9 11h6M9 15h2" />
    </Line>
  );
}

/** «This review was useful». */
export function ThumbUpIcon(props: IconProps) {
  return (
    <Line size={13} strokeWidth={1.7} {...props}>
      <path d="M7 21V9.5l4.4-6.1a1.8 1.8 0 0 1 3.1 1.6L13.6 9h5.2a1.9 1.9 0 0 1 1.8 2.4l-1.9 7.2A2.4 2.4 0 0 1 16.4 21Z" />
      <path d="M7 9.5H3.6V21H7" />
    </Line>
  );
}

/* -------------------------------------------------------------------------- */
/* The account family                                                         */
/* -------------------------------------------------------------------------- */

export function WalletIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.75} {...props}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      <path d="M18 12h.01" />
    </Line>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.7} {...props}>
      <path d="M4 20.2h4.2L19.4 9a2.4 2.4 0 0 0-3.4-3.4L4.8 16.8Z" />
      <path d="m14.6 7 2.4 2.4" />
    </Line>
  );
}

/** The plain shield: verification not started. */
export function ShieldPlainIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 2.8 4.8 5.6v5.6c0 4.4 3 8.1 7.2 9.4 4.2-1.3 7.2-5 7.2-9.4V5.6Z" />
    </Line>
  );
}

/** The shield with a cross through it: the last submission was refused. */
export function ShieldAlertIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 2.8 4.8 5.6v5.6c0 4.4 3 8.1 7.2 9.4 4.2-1.3 7.2-5 7.2-9.4V5.6Z" />
      <path d="M9.6 9.6l4.8 4.8M14.4 9.6l-4.8 4.8" />
    </Line>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M4.4 10.4h15.2a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2H4.4a2 2 0 0 1-2-2v-7.2a2 2 0 0 1 2-2Z" />
      <path d="M8.2 10.4V7.2a3.8 3.8 0 0 1 7.6 0v3.2" />
    </Line>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M20.4 11.7A8.4 8.4 0 0 1 7.9 19l-4.5 1.2L4.7 16A8.4 8.4 0 1 1 20.4 11.7Z" />
    </Line>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M9.4 9.4a2.6 2.6 0 1 1 3.4 2.5c-.5.2-.8.7-.8 1.2v.5" />
      <path d="M12 17.2h.01" />
    </Line>
  );
}

/** Three stacked ingots: the gold a customer holds by weight. */
export function GoldBarIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M4.4 15.6h15.2l-1.6 4.4H6Z" />
      <path d="M6.6 9.6h10.8l1.4 4.4H5.2Z" />
      <path d="M8.8 3.6h6.4l1.2 4.4H7.6Z" />
    </Line>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.8} {...props}>
      <path d="M4 7h16M9.4 7V4.6h5.2V7M6.4 7l.9 13.4h9.4L17.6 7" />
    </Line>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Line strokeWidth={2.2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Line>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.7} {...props}>
      <path d="M2 12s3.6-6.4 10-6.4S22 12 22 12s-3.6 6.4-10 6.4S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Line>
  );
}

/**
 * The eye with a line through it.
 *
 * The canvas draws the same open eye whether the password is showing or not,
 * which leaves the button saying the same thing in both states. This is the
 * other half of the toggle.
 */
export function EyeOffIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.7} {...props}>
      <path d="M4.2 8.4C2.8 10 2 12 2 12s3.6 6.4 10 6.4c1.5 0 2.8-.24 4-.64" />
      <path d="M19.4 15.4C21.2 13.8 22 12 22 12s-3.6-6.4-10-6.4c-1 0-1.9.1-2.7.3" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 3.9 4" />
      <path d="m3.5 3.5 17 17" />
    </Line>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M3.4 7.6h3.2l1.6-2.4h7.6l1.6 2.4h3.2a1.6 1.6 0 0 1 1.6 1.6v9a1.6 1.6 0 0 1-1.6 1.6H3.4a1.6 1.6 0 0 1-1.6-1.6v-9a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M12 16.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />
    </Line>
  );
}

export function MobileIcon(props: IconProps) {
  return (
    <Line strokeWidth={1.7} {...props}>
      <rect x="6.4" y="2.4" width="11.2" height="19.2" rx="2.6" />
      <path d="M10.6 18.4h2.8" />
    </Line>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M2.6 4.6h18.8v11.2H2.6Z" />
      <path d="M8 19.4h8" />
    </Line>
  );
}

/** The app on a device: a phone with a rounded body, like `MobileIcon`. */
export function AppIcon(props: IconProps) {
  return (
    <Line {...props}>
      <path d="M6.4 2.4h11.2a2 2 0 0 1 2 2v15.2a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2V4.4a2 2 0 0 1 2-2Z" />
      <path d="M10.4 18.6h3.2" />
    </Line>
  );
}
