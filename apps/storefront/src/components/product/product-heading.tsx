import Link from 'next/link';
import type { ProductDetail } from '@sharghigold/contracts';

import { StarIcon } from '@/components/icons';
import { persianCount, persianDecimal } from '@/lib/product-view';

/**
 * The title block: name, article number, rating, sales, stock.
 *
 * The rating is a link into the reviews page rather than an anchor into a
 * section further down, because the reviews are their own page here. The star
 * is decorative; the score is read out as text beside it.
 */
export function ProductHeading({ product }: { readonly product: ProductDetail }) {
  const { rating } = product;
  const hasReviews = rating.total > 0;

  return (
    <section className="zn-pdptitle">
      <h1 className="zn-pdptitle__name">{product.title}</h1>

      <p className="zn-pdptitle__meta">
        {product.latinTitle === null || product.latinTitle === ''
          ? `کد کالا ${product.sku}`
          : `${product.latinTitle} · کد کالا ${product.sku}`}
      </p>

      <div className="zn-pdptitle__facts">
        {hasReviews ? (
          <span className="zn-pdptitle__rating">
            <StarIcon size={15} />
            <span className="zn-pdptitle__score">{persianDecimal(rating.average)}</span>
            <Link className="zn-pdptitle__reviews" href={`/products/${product.slug}/reviews`}>
              ({persianCount(rating.total)} دیدگاه)
            </Link>
          </span>
        ) : (
          <Link className="zn-pdptitle__reviews" href={`/products/${product.slug}/reviews`}>
            هنوز دیدگاهی ثبت نشده — اولین نفر باشید
          </Link>
        )}

        {product.unitsSold > 0 ? (
          <span className="zn-pdptitle__sold">{persianCount(product.unitsSold)} فروش موفق</span>
        ) : null}

        <span className={`zn-pdptitle__stock${product.inStock ? '' : ' zn-pdptitle__stock--out'}`}>
          <span className="zn-pdptitle__dot" aria-hidden="true" />
          {product.inStock ? 'موجود در انبار' : 'ناموجود'}
        </span>
      </div>
    </section>
  );
}
