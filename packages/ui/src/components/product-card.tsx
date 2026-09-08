import type { ReactNode } from 'react';

import { toPersianDigits } from '../intl.js';
import { Badge } from './badge.js';

export interface ProductCardProps {
  readonly title: string;
  /**
   * Destination for the product. When given, the title becomes the link and an
   * invisible overlay makes the whole card clickable.
   *
   * The design canvas wraps the entire card in an `<a>`, which puts the
   * add-to-cart `<button>` inside a link. That is invalid HTML, and browsers
   * resolve it badly: the button is unreachable in some assistive technology
   * and Enter on it can follow the link instead of adding to the basket. One
   * link, one button, both siblings — same click target, correct semantics.
   */
  readonly href?: string;
  /**
   * The product image. A slot rather than a `src`, so the storefront can pass
   * `next/image` and keep this package free of a framework dependency.
   */
  readonly media?: ReactNode;
  /** Short specifications — purity, weight. Rendered as separate elements. */
  readonly specs?: readonly string[];
  /**
   * The price, already formatted, without the unit.
   *
   * A string and not a number on purpose. Prices are `bigint` rials and are
   * turned into text by `@sharghigold/money` on the server, where they are
   * computed. A bigint cannot cross the server/client boundary, and a price
   * that arrives as a float has already lost the argument.
   */
  readonly price: string;
  /** Pre-discount price, formatted the same way. Rendered struck through. */
  readonly wasPrice?: string;
  /** Whole-percent discount, for the corner badge. */
  readonly discountPct?: number;
  /** Show the «خرید اقساطی» badge. */
  readonly installment?: boolean;
  readonly inStock?: boolean;
  /**
   * Denser layout: smaller type, taller media, specs as plain dot-separated
   * text instead of chips. Used by the mobile rails and grids.
   */
  readonly compact?: boolean;
  /** Favourite control, if the surface has one. Positioned over the media. */
  readonly favorite?: ReactNode;
  /** Footer actions, if the surface has any. Typically add-to-cart. */
  readonly actions?: ReactNode;
}

/**
 * `<ProductCard>` — the design system's `.zn-pcard`.
 *
 * A Server Component. `favorite` and `actions` are slots rather than
 * `onFavorite`/`onAdd` callbacks as the design system declares, because a
 * callback prop would force every card — and so every product grid — into the
 * client bundle. Passing the interactive parts in as children keeps the card
 * itself server-rendered and crawlable, which the catalogue pages need, while
 * the buttons stay ordinary client islands.
 */
/** Stable empty default for `specs`, so an omitted prop keeps referential
 * equality across renders instead of allocating a fresh array each time. */
const NO_SPECS: readonly string[] = [];

export function ProductCard({
  title,
  href,
  media,
  specs = NO_SPECS,
  price,
  wasPrice,
  discountPct,
  installment = false,
  inStock = true,
  compact = false,
  favorite,
  actions,
}: ProductCardProps) {
  const className = ['zn-pcard', compact ? 'zn-pcard--compact' : null]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <article className={className}>
      <div className="zn-pcard__media">
        {media}
        <div className="zn-pcard__badges">
          {discountPct === undefined || discountPct === 0 ? null : (
            <Badge variant="solid-danger">{`${toPersianDigits(discountPct)}٪ تخفیف`}</Badge>
          )}
          {installment ? <Badge variant="gold">خرید اقساطی</Badge> : null}
          {inStock ? null : (
            <Badge variant="neutral" dot>
              ناموجود
            </Badge>
          )}
        </div>
        {favorite === undefined ? null : <span className="zn-pcard__fav">{favorite}</span>}
      </div>

      <div className="zn-pcard__body">
        <h3 className="zn-pcard__title">
          {href === undefined ? (
            title
          ) : (
            <a className="zn-pcard__link" href={href}>
              {title}
            </a>
          )}
        </h3>

        {specs.length === 0 ? null : (
          <div className="zn-pcard__specs">
            {specs.map((spec, index) => (
              // eslint-disable-next-line react/no-array-index-key -- a fixed positional list
              <span className="zn-pcard__spec" key={index}>
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="zn-pcard__price">
          {wasPrice === undefined ? null : (
            <span className="zn-pcard__was">
              {/* The strike-through is CSS, which most screen readers do not
                  announce. Without this the old price reads as a bare number
                  in front of the new one — two prices, no indication which is
                  which. */}
              <span className="sr-only">قیمت پیشین</span>
              {wasPrice}
            </span>
          )}
          <span className="zn-pcard__now">
            {/* The figure is its own element so it can be held on one line.
                U+066C, the Persian thousands separator, is a break opportunity
                for some layout engines: «۱۶۲٬۹۰۱٬۲۳۰» split across two lines
                reads as two numbers. */}
            <span className="zn-pcard__figure">{price}</span> <small>تومان</small>
          </span>
        </div>

        {actions === undefined ? null : <div className="zn-pcard__foot">{actions}</div>}
      </div>
    </article>
  );
}
