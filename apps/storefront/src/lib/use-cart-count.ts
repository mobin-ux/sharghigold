'use client';

import { useEffect, useState } from 'react';

/**
 * How many pieces are in the basket.
 *
 * A client island, deliberately. The count is per-customer, so rendering it on
 * the server would mean reading the session on every request and giving up a
 * cacheable homepage — and every cacheable catalogue page — for everyone, in
 * order to draw one bubble.
 *
 * This used to return a hard-coded zero, with a comment saying the basket
 * service did not exist. It does now, so a customer with three pieces in their
 * basket was shown an empty one on every screen of the shop.
 *
 * Failure is silent and means zero. The bubble is an affordance, not a fact a
 * decision rests on: the basket page reads the basket itself, and an error
 * banner over the header because a count could not be fetched would be worse
 * than a missing bubble.
 */
export function useCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Aborted on unmount so a slow response cannot set state on a component
    // that has gone, and so flicking between pages does not stack requests.
    const controller = new AbortController();

    const load = async (): Promise<void> => {
      const response = await fetch('/api/cart/count', {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) return;

      const body = (await response.json()) as { readonly count?: unknown };
      setCount(typeof body.count === 'number' && body.count > 0 ? body.count : 0);
    };

    void load().catch(() => {
      /* An unreachable basket is an absent bubble, not an error state. */
    });

    return () => controller.abort();
  }, []);

  return count;
}
