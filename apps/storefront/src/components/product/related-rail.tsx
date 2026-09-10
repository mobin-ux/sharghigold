import Link from 'next/link';
import { ProductCard } from '@sharghigold/ui';
import type { ProductDetail } from '@sharghigold/contracts';

import { ChevronIcon } from '@/components/icons';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { quoteProduct } from '@/server/catalogue/pricing';
import { persianCount, toman, weightLabel } from '@/lib/product-view';

/**
 * «مشابه این محصول».
 *
 * Each card is priced here, on the server, from the same function the page
 * itself uses — so a related ring shows the same figure its own page will.
 * The alternative, a price stored on a summary record, is the one that goes
 * stale between the rail and the page it leads to.
 *
 * Prefetch is left on, unlike the category tiles: this is at most four cards
 * chosen for this customer, not a grid of twenty-eight, and the next thing
 * they tap is very likely one of them.
 */
export function RelatedRail({
  products,
  categoryHref,
  now,
}: {
  readonly products: readonly ProductDetail[];
  readonly categoryHref: string;
  readonly now: Date;
}) {
  if (products.length === 0) return null;

  return (
    <section className="zn-related" aria-labelledby="related">
      <div className="zn-related__head">
        <h2 className="zn-related__title" id="related">
          مشابه این محصول
        </h2>
        <Link className="zn-related__all" href={categoryHref}>
          مشاهده همه
          <ChevronIcon size={14} strokeWidth={2} />
        </Link>
      </div>

      <ul className="zn-related__rail">
        {products.map((related) => (
          <li className="zn-related__cell" key={related.slug}>
            <ProductCard
              compact
              title={related.title}
              href={`/products/${related.slug}`}
              media={<MediaPlaceholder label={related.media[0]?.alt ?? related.title} />}
              specs={[`${persianCount(related.karat)} عیار`, weightLabel(related.weightMilligrams)]}
              price={toman(quoteProduct(related, now).totalRials)}
              inStock={related.inStock}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
