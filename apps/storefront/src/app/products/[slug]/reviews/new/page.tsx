import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductChrome } from '@/components/product/product-chrome';
import { ReviewForm } from '@/components/product/review-form';
import { getProduct } from '@/server/catalogue/product';

import '../../product.css';
import '../reviews.css';
import './write.css';

export const metadata: Metadata = {
  title: 'ثبت دیدگاه',
  // A form for one customer about one purchase. There is nothing here for a
  // search engine, and indexing it would compete with the reviews page itself.
  robots: { index: false, follow: true },
};

/**
 * The review form.
 *
 * Its own route, so «back» leaves the form rather than the product page, and
 * so an unfinished review survives a tab switch the way any other page does.
 */
export default async function WriteReviewPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (product === undefined) notFound();

  return (
    <div className="zn-shell zn-shell--product">
      <ProductChrome title="ثبت دیدگاه" backHref={`/products/${slug}/reviews`} />

      <main className="zn-subpage">
        <ReviewForm
          slug={slug}
          productTitle={product.title}
          mediaAlt={product.media[0]?.alt ?? product.title}
        />
      </main>
    </div>
  );
}
