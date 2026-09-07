'use client';

import { useEffect, useState } from 'react';

import { toPersianDigits } from '@sharghigold/ui';

function pad(value: number): string {
  return toPersianDigits(String(value).padStart(2, '0'));
}

function parts(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Countdown to the end of the flash sale.
 *
 * The remaining time is passed in from the server rather than computed from
 * the visitor's clock. A device with a wrong clock — or one deliberately set
 * forward — must not be able to decide whether an offer is still running; the
 * server does, and this only draws it.
 *
 * `suppressHydrationWarning` covers the one tick that may elapse between the
 * server rendering the figure and the browser hydrating it.
 */
export function DealCountdown({ secondsRemaining }: { readonly secondsRemaining: number }) {
  const [remaining, setRemaining] = useState(secondsRemaining);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <span className="zn-countdown" suppressHydrationWarning>
      {/* Labelled but not a live region: a screen reader should read the time
          when the user reaches it, not re-announce it every second. */}
      <span className="sr-only">زمان باقی‌مانده تا پایان پیشنهاد</span>
      <span>{parts(remaining)}</span>
    </span>
  );
}
