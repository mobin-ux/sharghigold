import { ProductCard } from '@sharghigold/ui';

import type { ProductView } from '@/lib/catalogue';

/**
 * Stand-in for product photography.
 *
 * There are no product images yet. Rather than a broken `<img>` or an empty
 * box, this fills the media area with the same gold wash the design uses
 * behind photographs, and carries the product name so the gap is legible in
 * review. It is decorative — the card already names the product in its
 * heading — so it is hidden from assistive technology.
 *
 * Replaced by `next/image` when photography exists; the card takes the media
 * as a slot precisely so that swap touches nothing else.
 */
function MediaPlaceholder({ label }: { readonly label: string }) {
  return (
    <span className="zn-media-ph" aria-hidden="true">
      {`تصویر ${label}`}
    </span>
  );
}

/**
 * A product card as the homepage rails and grids use it.
 *
 * No add-to-cart button and no favourite control: on this page a card is a
 * link into the product, exactly as the design has it. Both are slots on
 * `ProductCard`, so the pages that do offer them pass them in without this one
 * having to hide them.
 */
export function ProductTile({ product }: { readonly product: ProductView }) {
  return (
    <ProductCard
      compact
      title={product.title}
      href={product.href}
      media={<MediaPlaceholder label={product.title} />}
      specs={product.specs}
      price={product.price}
      {...(product.wasPrice === undefined ? {} : { wasPrice: product.wasPrice })}
      {...(product.discountPct === undefined ? {} : { discountPct: product.discountPct })}
      installment={product.installment}
      inStock={product.inStock}
    />
  );
}
