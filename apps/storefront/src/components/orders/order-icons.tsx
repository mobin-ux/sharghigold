import type { ReactNode } from 'react';

/**
 * The Orders canvas's own glyphs, path for path.
 *
 * Kept apart from the shared `icons.tsx` because these are drawn at the
 * canvas's sizes and weights — a 20px back arrow at 1.9, 19px action icons at
 * 1.7 — and a shared icon bent to match would change every other page. All of
 * them are decorative and hidden from assistive technology at source.
 */
function Stroke({
  size,
  weight,
  children,
}: {
  readonly size: number;
  readonly weight: number;
  readonly children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function BackIcon() {
  return (
    <Stroke size={20} weight={1.9}>
      <path d="m14.5 5 7 7-7 7" />
      <path d="M21.5 12H3" />
    </Stroke>
  );
}

export function LensIcon() {
  return (
    <Stroke size={17} weight={1.8}>
      <circle cx="11" cy="11" r="6.6" />
      <path d="m16 16 4.4 4.4" />
    </Stroke>
  );
}

/** The ring the canvas draws where a product photo will go. */
export function PieceIcon({ size = 26 }: { readonly size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 7.6a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 2.1a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z" />
      <path d="m12 2.6 2 3.1h-4Z" />
    </svg>
  );
}

export function ReceiptIcon() {
  return (
    <Stroke size={28} weight={1.6}>
      <path d="M6.4 2.6h11.2a1.6 1.6 0 0 1 1.6 1.6v17.2l-3.4-2.2-3.4 2.2-3.4-2.2-3.4 2.2V4.2a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M9 9.6h6M9 13.4h4" />
    </Stroke>
  );
}

export function TruckIcon({
  size = 16,
  weight = 1.9,
}: {
  readonly size?: number;
  readonly weight?: number;
}) {
  return (
    <Stroke size={size} weight={weight}>
      <path d="M2.6 16.4V7.6h11.2v8.8Z" />
      <path d="M13.8 10.6h3.6l2.6 3v2.8h-6.2Z" />
      <circle cx="7" cy="17.6" r="1.8" />
      <circle cx="16.6" cy="17.6" r="1.8" />
    </Stroke>
  );
}

export function CopyIcon() {
  return (
    <Stroke size={15} weight={1.8}>
      <rect x="8.4" y="8.4" width="12" height="12" rx="2.4" />
      <path d="M15.6 5.6H5.6a2 2 0 0 0-2 2v10" />
    </Stroke>
  );
}

export function ChevronStartIcon() {
  return (
    <Stroke size={15} weight={2}>
      <path d="m14 6-6 6 6 6" />
    </Stroke>
  );
}

export function TickIcon({
  size = 12,
  weight = 3.2,
}: {
  readonly size?: number;
  readonly weight?: number;
}) {
  return (
    <Stroke size={size} weight={weight}>
      <path d="m5 12.5 4.4 4.3L19 7.2" />
    </Stroke>
  );
}

export function StarIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 3.4 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.6l5.9-.8Z" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <Stroke size={19} weight={1.9}>
      <path d="m4 12 16-7.4-3 7.4 3 7.4Z" />
      <path d="M4 12h13" />
    </Stroke>
  );
}

export function PrintIcon() {
  return (
    <Stroke size={17} weight={1.8}>
      <path d="M6.6 8.6V3.4h10.8v5.2" />
      <path d="M6.6 17.4H4.4a1.8 1.8 0 0 1-1.8-1.8v-5.2a1.8 1.8 0 0 1 1.8-1.8h15.2a1.8 1.8 0 0 1 1.8 1.8v5.2a1.8 1.8 0 0 1-1.8 1.8h-2.2" />
      <path d="M6.6 14h10.8v6.6H6.6Z" />
    </Stroke>
  );
}

/** The row icons of the order's action list, keyed as the canvas keys them. */
const ACTION_PATHS = {
  track: ['M2.6 16.4V7.6h11.2v8.8Z', 'M13.8 10.6h3.6l2.6 3v2.8h-6.2Z'],
  invoice: ['M6 2.6h9.4L19 6.2v15.2H6Z', 'M9.4 11h6.2M9.4 15h4.4'],
  cancel: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8'],
  ret: ['M4 9.6h11.4a4.4 4.4 0 1 1 0 8.8H8.2', 'm7.6 5.6-3.8 4 3.8 4'],
  review: ['m12 3.4 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.6l5.9-.8Z'],
  again: [
    'M2.8 3.4h2.1l2.4 11a1.7 1.7 0 0 0 1.7 1.3h8.2a1.7 1.7 0 0 0 1.7-1.3L20.5 7H5.6',
    'M9 20.2h.01M17.6 20.2h.01',
  ],
  support: ['M20.4 11.7A8.4 8.4 0 0 1 7.9 19l-4.5 1.2L4.7 16A8.4 8.4 0 1 1 20.4 11.7Z'],
  returnStatus: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.4V12l3 1.8'],
} as const;

export type OrderActionKey = keyof typeof ACTION_PATHS;

export function ActionIcon({ name }: { readonly name: OrderActionKey }) {
  return (
    <Stroke size={19} weight={1.7}>
      {ACTION_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </Stroke>
  );
}
