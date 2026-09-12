import { DealCountdown } from '@/components/home/deal-countdown';
import { ProductTile } from '@/components/home/product-tile';
import type { ProductSummary } from '@sharghigold/contracts';

/**
 * «پیشنهاد شگفت‌انگیز» — the dark flash-sale rail.
 *
 * Only the countdown hydrates. The heading, the cards and their prices are all
 * server-rendered, so the offer is readable and crawlable before a single byte
 * of the client bundle arrives.
 */
export function DealsRail({
  products,
  secondsRemaining,
}: {
  readonly products: readonly ProductSummary[];
  readonly secondsRemaining: number;
}) {
  return (
    <section className="zn-rail-section zn-rail-section--dark" aria-labelledby="deals-heading">
      <div className="zn-sechead zn-sechead--dark">
        <h2 className="zn-sechead__title" id="deals-heading">
          پیشنهاد شگفت‌انگیز
          <span className="zn-sechead__pulse" aria-hidden="true" />
        </h2>
        <DealCountdown secondsRemaining={secondsRemaining} />
      </div>

      <ul className="zn-rail zn-rail--tight" tabIndex={0} aria-labelledby="deals-heading">
        {products.map((product) => (
          <li className="zn-rail__item" key={product.slug}>
            <ProductTile product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
