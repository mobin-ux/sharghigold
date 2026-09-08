import { ProductCard } from '@sharghigold/ui';

import type { ProductView } from '@/lib/catalogue';

/**
 * A product card as the homepage rails and grids use it.
 *
 * No media is passed. That matches the canvas, which leaves `.zn-pcard__media`
 * as its bare gold wash on this page rather than filling it with an image slot
 * — the card is identified by its title, weight and price, and a caption
 * repeating the title inside the picture area only crowds it.
 *
 * No add-to-cart button and no favourite control either, exactly as the design
 * has it. All three are slots on `ProductCard`, so the pages that do offer them
 * pass them in without this one having to hide them, and `next/image` drops
 * into the media slot when photography exists.
 */
export function ProductTile({ product }: { readonly product: ProductView }) {
  return (
    <ProductCard
      compact
      title={product.title}
      href={product.href}
      specs={product.specs}
      price={product.price}
      {...(product.wasPrice === undefined ? {} : { wasPrice: product.wasPrice })}
      {...(product.discountPct === undefined ? {} : { discountPct: product.discountPct })}
      installment={product.installment}
      inStock={product.inStock}
    />
  );
}
