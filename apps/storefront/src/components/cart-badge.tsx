'use client';

import { toPersianDigits } from '@sharghigold/ui';

import { useCartCount } from '@/lib/use-cart-count';

/**
 * The count bubble on the basket icon.
 *
 * A client island on purpose. The count is per-customer, so rendering it on the
 * server would mean reading the session on every request and giving up a
 * cacheable homepage for everyone — the canvas can show «۲» because a canvas
 * has no cache and no second visitor.
 *
 * Renders nothing at all when the basket is empty, rather than a «۰» bubble:
 * an empty basket has nothing to announce, and the design only ever draws this
 * with a count in it.
 */
export function CartBadge({ variant = 'header' }: { readonly variant?: 'header' | 'tab' }) {
  const count = useCartCount();
  if (count <= 0) return null;

  return (
    <span className={`zn-cartbadge zn-cartbadge--${variant}`}>
      <span className="sr-only">تعداد اقلام سبد خرید:</span>
      {toPersianDigits(count)}
    </span>
  );
}
