/**
 * Stand-in for photography that does not exist yet.
 *
 * Matches what the canvas shows in its image slots — a tinted panel, a 28px
 * picture glyph at 45% and a caption naming what belongs there — with one thing
 * deliberately left out: the canvas slot also draws a dashed drop-target ring,
 * and that is the design tool's "drag an image here" affordance rather than a
 * design decision. Shipping it would put editor chrome on a storefront.
 *
 * Decorative: whatever surrounds this already names the thing in text, so the
 * caller hides it from assistive technology.
 *
 * Replaced by `next/image` when photography exists. Everywhere this is used
 * takes the media as a slot precisely so that swap touches nothing else.
 */
export function MediaPlaceholder({ label }: { readonly label: string }) {
  return (
    <span className="zn-media-ph" aria-hidden="true">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span className="zn-media-ph__cap">{label}</span>
    </span>
  );
}
