import type { ReactElement } from 'react';

/**
 * The six jewellery category marks from the design canvas.
 *
 * Unlike the line icons these are filled, multi-tone drawings that use the
 * gold and teal token ramps directly. Copied path-for-path from the design so
 * the shapes are the designer's, not an approximation of them.
 *
 * Decorative: each sits above its own category name.
 */
function Mark({ children }: { readonly children: readonly ReactElement[] }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function RingMark() {
  return (
    <Mark>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22.4a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Zm0-2.9a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Z"
        fill="var(--gold-600)"
      />
      <path d="M9.5 8.7 12 7.1l2.5 1.6-.7 1.5h-3.6Z" fill="var(--gold-500)" />
      <path d="M12 1.4 15.2 5 12 8.6 8.8 5Z" fill="var(--teal-700)" />
      <path d="M12 1.4 15.2 5H8.8Z" fill="var(--teal-500)" />
    </Mark>
  );
}

export function EarringMark() {
  return (
    <Mark>
      <path
        d="M12 1.8a4.4 4.4 0 0 0-4.4 4.4v1.4h2.5V6.2a1.9 1.9 0 0 1 3.8 0v2.1h2.5V6.2A4.4 4.4 0 0 0 12 1.8Z"
        fill="var(--gold-600)"
      />
      <path
        d="M12 9.2c-2.7 3.7-4 6-4 7.6a4 4 0 0 0 8 0c0-1.6-1.3-3.9-4-7.6Z"
        fill="var(--gold-600)"
      />
      <path
        d="M12 11.4c-1.4 2-2.1 3.2-2.1 4.1a2.1 2.1 0 0 0 1.1 1.9c-1.2-1.9-.6-3.8 1-6Z"
        fill="var(--gold-400)"
      />
      <circle cx="12" cy="17.4" r="1.7" fill="var(--teal-700)" />
    </Mark>
  );
}

export function NecklaceMark() {
  return (
    <Mark>
      <path
        d="M2.6 3.2h2.6c0 4.2 3 7.4 6.8 7.4s6.8-3.2 6.8-7.4h2.6c0 5.6-4.2 10-9.4 10S2.6 8.8 2.6 3.2Z"
        fill="var(--gold-600)"
      />
      <path
        d="M12 12.8c-2.1 2.8-3.2 4.5-3.2 5.7a3.2 3.2 0 0 0 6.4 0c0-1.2-1.1-2.9-3.2-5.7Z"
        fill="var(--gold-500)"
      />
      <path
        d="M12 15.4c-1.1 1.6-1.6 2.5-1.6 3.1a1.6 1.6 0 0 0 .8 1.5c-.9-1.5-.4-3 .8-4.6Z"
        fill="var(--gold-300)"
      />
      <circle cx="12" cy="18.4" r="1.5" fill="var(--teal-700)" />
    </Mark>
  );
}

export function BangleMark() {
  return (
    <Mark>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-3.6a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8Z"
        fill="var(--gold-600)"
      />
      <path d="M4.6 6.6A8.2 8.2 0 0 1 12 2.6v3.4a4.9 4.9 0 0 0-4.4 2.4Z" fill="var(--gold-400)" />
      <path d="M12 1.2 14.3 4 12 6.8 9.7 4Z" fill="var(--teal-700)" />
    </Mark>
  );
}

export function BraceletMark() {
  return (
    <Mark>
      <g fill="var(--gold-600)">
        <circle cx="20" cy="12" r="2.2" />
        <circle cx="17.7" cy="17.7" r="2.2" />
        <circle cx="12" cy="20" r="2.2" />
        <circle cx="6.3" cy="17.7" r="2.2" />
        <circle cx="4" cy="12" r="2.2" />
        <circle cx="6.3" cy="6.3" r="2.2" />
        <circle cx="17.7" cy="6.3" r="2.2" />
      </g>
      <g fill="var(--gold-400)">
        <circle cx="19.3" cy="11.3" r="0.8" />
        <circle cx="5.6" cy="16.9" r="0.8" />
        <circle cx="11.3" cy="19.3" r="0.8" />
      </g>
      <path d="M12 1.4 15 5l-3 3.6L9 5Z" fill="var(--teal-700)" />
      <path d="M12 1.4 15 5H9Z" fill="var(--teal-500)" />
    </Mark>
  );
}

export function SetMark() {
  return (
    <Mark>
      <path
        d="M6.2 2.4h2.4c0 2.9 1.5 5 3.4 5s3.4-2.1 3.4-5h2.4c0 4.3-2.6 7.4-5.8 7.4S6.2 6.7 6.2 2.4Z"
        fill="var(--gold-600)"
      />
      <path
        d="M12 9.6c-1.7 2.3-2.6 3.7-2.6 4.6a2.6 2.6 0 0 0 5.2 0c0-.9-.9-2.3-2.6-4.6Z"
        fill="var(--gold-500)"
      />
      <circle cx="12" cy="14.6" r="1.3" fill="var(--teal-700)" />
      <path
        d="M3.5 11.2a2.2 2.2 0 0 0-2.2 2.2v.9h1.3v-.9a.9.9 0 0 1 1.8 0v1.1h1.3v-1.1a2.2 2.2 0 0 0-2.2-2.2Z"
        fill="var(--gold-600)"
      />
      <path
        d="M3.5 15c-1.4 1.9-2.1 3-2.1 3.8a2.1 2.1 0 0 0 4.2 0c0-.8-.7-1.9-2.1-3.8Z"
        fill="var(--gold-500)"
      />
      <path
        d="M20.5 11.2a2.2 2.2 0 0 0-2.2 2.2v.9h1.3v-.9a.9.9 0 0 1 1.8 0v1.1h1.3v-1.1a2.2 2.2 0 0 0-2.2-2.2Z"
        fill="var(--gold-600)"
      />
      <path
        d="M20.5 15c-1.4 1.9-2.1 3-2.1 3.8a2.1 2.1 0 0 0 4.2 0c0-.8-.7-1.9-2.1-3.8Z"
        fill="var(--gold-500)"
      />
    </Mark>
  );
}
