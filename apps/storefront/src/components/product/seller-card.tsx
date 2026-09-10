import Link from 'next/link';

import { SELLER } from '@/server/policy/shop-policy';

/**
 * Who is selling this.
 *
 * One seller for now, so the card is policy rather than product data. It stays
 * on the page because a customer buying gold online wants to know whose licence
 * is behind it, and because the day there is a second seller this is where the
 * answer already lives.
 */
export function SellerCard() {
  return (
    <section className="zn-seller" aria-label="فروشنده">
      <span className="zn-seller__badge" aria-hidden="true">
        {SELLER.initial}
      </span>

      <span className="zn-seller__text">
        <span className="zn-seller__name">فروشنده: {SELLER.name}</span>
        <span className="zn-seller__note">{SELLER.note}</span>
      </span>

      <Link className="zn-seller__link" href="/about">
        مشاهده ‹
      </Link>
    </section>
  );
}
