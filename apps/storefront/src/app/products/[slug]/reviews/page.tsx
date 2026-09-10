import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { reviewQuerySchema } from '@sharghigold/contracts';

import { AspectScores } from '@/components/product/aspect-scores';
import { ProductChrome } from '@/components/product/product-chrome';
import { RatingBars } from '@/components/product/rating-bars';
import { ReviewCard } from '@/components/product/review-card';
import { ReviewFilters, reviewsHref } from '@/components/product/review-filters';
import { persianCount } from '@/lib/product-view';
import { getProduct } from '@/server/catalogue/product';
import { getReviewPage } from '@/server/catalogue/reviews';

import '../product.css';
import './reviews.css';

/** How many more reviews «نمایش دیدگاه‌های بیشتر» asks for. */
const PAGE_STEP = 4;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);

  if (product === undefined) return { title: 'کالا پیدا نشد' };

  return {
    title: `دیدگاه خریداران — ${product.title}`,
    description: `${product.rating.total > 0 ? `${product.rating.average} از ۵ · ` : ''}تجربه خریداران درباره ${product.title}.`,
    alternates: { canonical: `/products/${product.slug}/reviews` },
  };
}

/**
 * Every review for a product, filtered and sorted on the server.
 *
 * Its own page rather than a view the product page swaps to, which is what the
 * canvas does with a single file. Reviews are what people search for and link
 * to; a filtered list that lives only in a component's state has no URL, no
 * back button and nothing for a crawler to index.
 *
 * The query is parsed against the shared schema before it is used. `filter`
 * and `sort` arrive from the URL, so they are attacker-chosen text; turning
 * them into an enum here is what stops a value ever reaching the store. A
 * missing parameter takes the default, and an unrecognised one is refused
 * rather than quietly ignored.
 */
export default async function ProductReviewsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (product === undefined) notFound();

  const raw = await searchParams;
  const single = (key: string) => (typeof raw[key] === 'string' ? raw[key] : undefined);

  const parsed = reviewQuerySchema.safeParse({
    filter: single('filter'),
    sort: single('sort'),
    limit: single('limit') === undefined ? undefined : Number(single('limit')),
  });

  // A stale or hand-edited link lands on the default listing rather than an
  // error: this is a browsing surface, and a working page is a better answer
  // to a bad URL than a refusal.
  const query = parsed.success ? parsed.data : reviewQuerySchema.parse({});
  const page = await getReviewPage(slug, query);
  const now = new Date();

  return (
    <>
      <a className="skip-link" href="#reviews">
        رفتن به فهرست دیدگاه‌ها
      </a>

      <div className="zn-shell zn-shell--product">
        <ProductChrome title="دیدگاه خریداران" backHref={`/products/${slug}`} />

        <main className="zn-subpage">
          <section className="zn-rvhead">
            <h1 className="zn-rvhead__title">دیدگاه خریداران</h1>
            <p className="zn-rvhead__product">
              {product.title}
              {product.rating.total > 0
                ? ` · ${persianCount(product.rating.total)} دیدگاه ثبت‌شده`
                : ''}
            </p>

            {product.rating.total > 0 ? (
              <div className="zn-rvhead__summary">
                <RatingBars rating={product.rating} showStars showPercent />
              </div>
            ) : null}
          </section>

          <AspectScores aspects={page.aspects} />

          <ReviewFilters
            slug={slug}
            filter={query.filter}
            sort={query.sort}
            shown={page.reviews.length}
            total={page.total}
          />

          <section className="zn-rvlist" id="reviews" aria-label="فهرست دیدگاه‌ها">
            {page.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} now={now} detailed />
            ))}

            {page.reviews.length === 0 ? (
              <div className="zn-rvempty">
                <p className="zn-rvempty__title">
                  {page.total === 0 ? 'هنوز دیدگاهی ثبت نشده است' : 'دیدگاهی با این فیلتر نیست'}
                </p>
                <p className="zn-rvempty__body">
                  {page.total === 0
                    ? 'اگر این کالا را خریده‌اید، تجربه شما به خریداران بعدی کمک می‌کند.'
                    : 'فیلتر «همه» را انتخاب کنید تا تمام دیدگاه‌ها نمایش داده شود.'}
                </p>
              </div>
            ) : null}

            {page.reviews.length < page.matched ? (
              <Link
                className="zn-rvmore"
                href={reviewsHref(slug, {
                  filter: query.filter,
                  sort: query.sort,
                  limit: query.limit + PAGE_STEP,
                })}
              >
                نمایش دیدگاه‌های بیشتر
              </Link>
            ) : null}
          </section>
        </main>

        <div className="zn-actionbar">
          <Link className="zn-actionbar__cta" href={`/products/${slug}/reviews/new`}>
            ثبت دیدگاه شما
          </Link>
        </div>
      </div>
    </>
  );
}
