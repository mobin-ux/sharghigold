import { ProductTile } from '@/components/home/product-tile';
import { SectionHeader } from '@/components/home/section-header';
import type { ProductSummary } from '@sharghigold/contracts';

/**
 * A horizontally scrolling row of product cards.
 *
 * The rail is a `<ul>` with `tabIndex={0}`: a scroll container that can only
 * be reached with a pointer is unusable from a keyboard, and browsers only
 * make one focusable if you ask. Everything inside is a link, so tabbing
 * through the cards scrolls the rail anyway — the focusable container is for
 * the case where someone wants to scroll it without walking every card.
 */
export function ProductRail({
  id,
  title,
  href,
  products,
  tone = 'light',
}: {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly products: readonly ProductSummary[];
  readonly tone?: 'light' | 'dark';
}) {
  return (
    <section className={`zn-rail-section zn-rail-section--${tone}`} aria-labelledby={id}>
      <SectionHeader id={id} title={title} {...(href === undefined ? {} : { href })} tone={tone} />
      <ul className="zn-rail" tabIndex={0} aria-labelledby={id}>
        {products.map((product) => (
          <li className="zn-rail__item" key={product.slug}>
            <ProductTile product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
