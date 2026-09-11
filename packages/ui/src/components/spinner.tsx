export interface SpinnerProps {
  /** The design system's three sizes, or a pixel value. */
  readonly size?: 'sm' | 'md' | 'lg' | number;
  /** What is being waited for. Read aloud, so say the thing, not «loading». */
  readonly label?: string;
}

const SIZES = { sm: 18, md: 28, lg: 40 } as const;

/**
 * `<Spinner>` — something is happening and it is not finished.
 *
 * `role="status"` with a name, so a screen reader says what is being waited
 * for rather than announcing a decorative circle. The ring is drawn by the
 * design system's own rule; only the diameter and the stroke are set here,
 * because the stroke is a tenth of the diameter and CSS has no way to say so.
 *
 * A Server Component: it spins in CSS and owns no state.
 */
export function Spinner({ size = 'md', label = 'در حال بارگذاری' }: SpinnerProps) {
  const pixels = typeof size === 'number' ? size : SIZES[size];

  return (
    <span
      className="zn-spinner"
      role="status"
      aria-label={label}
      style={{
        width: `${pixels}px`,
        height: `${pixels}px`,
        borderWidth: `${Math.max(2, Math.round(pixels / 10))}px`,
      }}
    />
  );
}
