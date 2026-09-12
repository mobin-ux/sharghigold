'use client';

import { useEffect, useState } from 'react';
import { toPersianDigits } from '@sharghigold/ui';

/**
 * «قیمت قفل شده تا ۰۴:۳۷» — the design system's `.zn-lock`, counting down.
 *
 * A client island, and one of the very few on these screens, because a clock
 * is the one thing a server render genuinely cannot do.
 *
 * It counts down from a figure the server computed against the basket's stored
 * lock, so a reload resumes where the lock actually is rather than restarting
 * the timer. What it is *not* is the check: reaching zero here reveals the
 * refresh banner, and the server refuses to place an order against an expired
 * lock whatever this element happens to be showing.
 */
export function PriceLock({
  secondsRemaining,
  onExpiry,
}: {
  readonly secondsRemaining: number;
  /** Rendered in place of the countdown once it reaches zero. */
  readonly onExpiry?: string;
}) {
  const [left, setLeft] = useState(secondsRemaining);

  // The server's figure is the truth on every render it sends.
  const [seen, setSeen] = useState(secondsRemaining);
  if (seen !== secondsRemaining) {
    setSeen(secondsRemaining);
    setLeft(secondsRemaining);
  }

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1_000);
    return () => clearTimeout(timer);
  }, [left]);

  const expired = left <= 0;
  const minutes = Math.floor(Math.max(left, 0) / 60);
  const seconds = Math.max(left, 0) % 60;

  return (
    <span className={expired ? 'zn-lock zn-lock--expired' : 'zn-lock'} role="timer">
      <span className="zn-lock__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </span>
      <span className="zn-lock__text">
        {expired ? (onExpiry ?? 'مهلت قیمت به پایان رسید') : 'قیمت قفل شده تا'}
      </span>
      {expired ? null : (
        <span className="zn-lock__time">
          {toPersianDigits(minutes)}:{toPersianDigits(String(seconds).padStart(2, '0'))}
        </span>
      )}
    </span>
  );
}
