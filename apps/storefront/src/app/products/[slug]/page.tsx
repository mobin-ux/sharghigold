import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AssuranceList } from '@/components/product/assurance-list';
import { Breadcrumbs } from '@/components/product/breadcrumbs';
import { BuyBar } from '@/components/product/buy-bar';
import { FaqAccordion } from '@/components/product/faq-accordion';
import { InstallmentCard } from '@/components/product/installment-card';
import { PriceCard } from '@/components/product/price-card';
import { ProductChrome } from '@/components/product/product-chrome';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductHeading } from '@/components/product/product-heading';
import { ProductLinks } from '@/components/product/product-links';
import { PurchaseProvider } from '@/components/product/purchase-context';
import { RatingBars } from '@/components/product/rating-bars';
import { RelatedRail } from '@/components/product/related-rail';
import { ReviewCard } from '@/components/product/review-card';
import { SectionTabs } from '@/components/product/section-tabs';
import { SellerCard } from '@/components/product/seller-card';
import { SizeGuideSheet } from '@/components/product/size-guide-sheet';
import { SpecTable } from '@/components/product/spec-table';
import { ColourPicker, SizePicker } from '@/components/product/variant-pickers';
import { persianCount } from '@/lib/product-view';
import { getProduct, getRelatedProducts } from '@/server/catalogue/product';
import { quoteProduct } from '@/server/catalogue/pricing';
import { countAnsweredQuestions } from '@/server/catalogue/questions';
import { getReviewPage } from '@/server/catalogue/reviews';
import { PRODUCT_FAQS } from '@/server/policy/shop-policy';
import { placementOf } from './lib';

import './product.css';

/**
 * Rendered per request, never prerendered.
 *
 * The page quotes a live price with a five-minute expiry on it. A statically
 * generated copy would serve a countdown that started before the customer
 * arrived, and a total struck against whatever the rate was when the build
 * ran. Freshness is the feature.
 */
export const dynamic = 'force-dynamic';

/** How many reviews the product page itself shows before sending you to the list. */
const REVIEW_PREVIEW = 2;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);

  if (product === undefined) return { title: 'کالا پیدا نشد' };

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  // Arbitrary text from the URL. It is only ever used as a lookup key, and an
  // unknown value is a 404 rather than anything reaching the catalogue.
  const { slug } = await params;
  const product = await getProduct(slug);

  if (product === undefined) notFound();

  const now = new Date();

  const [related, reviews, answered] = await Promise.all([
    getRelatedProducts(product),
    getReviewPage(slug, { filter: 'all', sort: 'helpful', limit: REVIEW_PREVIEW }),
    countAnsweredQuestions(slug),
  ]);

  const quote = quoteProduct(product, now);
  const { categoryHref, installmentHref, noun } = placementOf(product);

  return (
    <>
      <a className="skip-link" href="#product">
        رفتن به محتوای کالا
      </a>

      <div className="zn-shell zn-shell--product">
        <PurchaseProvider product={product} quote={quote}>
          <ProductChrome title={product.title} backHref={categoryHref} revealTitleOnScroll />

          <main id="product">
            <Breadcrumbs steps={product.breadcrumb} />
            <ProductGallery product={product} />
            <ProductHeading product={product} />

            <ColourPicker product={product} />
            <SizePicker product={product} />

            <PriceCard product={product} quote={quote} />

            {quote.plans.length > 0 ? (
              <InstallmentCard plans={quote.plans} termsHref={installmentHref} noun={noun} />
            ) : null}

            <AssuranceList />
            <SellerCard />
            <SectionTabs />
            <SpecTable specs={product.specs} />

            <section className="zn-about" aria-labelledby="about">
              <h2 className="zn-about__title" id="about">
                درباره این {noun}
              </h2>
              <p className="zn-about__body">{product.description}</p>
            </section>

            <section className="zn-pdpreviews" aria-labelledby="reviews">
              <div className="zn-pdpreviews__head">
                <h2 className="zn-pdpreviews__title" id="reviews">
                  دیدگاه خریداران
                </h2>
                <Link className="zn-pdpreviews__write" href={`/products/${slug}/reviews/new`}>
                  ثبت دیدگاه
                </Link>
              </div>

              {reviews.total === 0 ? (
                <p className="zn-pdpreviews__empty">
                  هنوز دیدگاهی برای این کالا ثبت نشده است. اگر آن را خریده‌اید، تجربه‌تان به
                  خریداران بعدی کمک می‌کند.
                </p>
              ) : (
                <>
                  <div className="zn-pdpreviews__summary">
                    <RatingBars rating={product.rating} />
                  </div>

                  <div className="zn-pdpreviews__list">
                    {reviews.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} now={now} />
                    ))}
                  </div>

                  <Link className="zn-pdpreviews__all" href={`/products/${slug}/reviews`}>
                    مشاهده همه {persianCount(reviews.total)} دیدگاه
                  </Link>
                </>
              )}
            </section>

            <ProductLinks
              slug={slug}
              installmentHref={installmentHref}
              answeredQuestions={answered}
            />

            <FaqAccordion questions={PRODUCT_FAQS} />

            <RelatedRail products={related} categoryHref={categoryHref} now={now} />

            <div className="zn-pdp__tail" />
          </main>

          <SizeGuideSheet rows={product.sizeGuide} />
          <BuyBar product={product} quote={quote} />
        </PurchaseProvider>
      </div>
    </>
  );
}
