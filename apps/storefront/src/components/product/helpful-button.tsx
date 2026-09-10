'use client';

import { useState } from 'react';

import { ThumbUpIcon } from '@/components/icons';
import { persianCount } from '@/lib/product-view';

/**
 * «مفید بود (۲۴)».
 *
 * The count moves optimistically, because the alternative is a control that
 * appears not to work until a round trip finishes. It is a display only: the
 * vote itself belongs to the reviews service, which counts one per customer
 * and is the only thing that decides what the number is. Nothing here is
 * persisted yet, and the button says so to assistive technology by staying a
 * toggle rather than claiming a result.
 */
export function HelpfulButton({ count }: { readonly count: number }) {
  const [voted, setVoted] = useState(false);

  return (
    <button
      className={`zn-helpful${voted ? ' zn-helpful--on' : ''}`}
      type="button"
      aria-pressed={voted}
      onClick={() => setVoted((was) => !was)}
    >
      <ThumbUpIcon />
      مفید بود ({persianCount(count + (voted ? 1 : 0))})
    </button>
  );
}
