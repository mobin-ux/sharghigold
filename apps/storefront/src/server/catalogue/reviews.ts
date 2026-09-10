/**
 * Customer reviews for a product.
 *
 * PLACEHOLDER CONTENT behind a real seam. The fixture below is deleted when
 * `GET /api/v1/products/:slug/reviews` exists; `getReviewPage` keeps its
 * signature and its parse.
 *
 * Filtering and ordering happen here, on the server, and the result is
 * `limit`-ed here too. Sending every review to the browser and letting a
 * client component hide most of them would put the whole set in the page
 * source, which is both a payload nobody asked for and a way for a filter to
 * be «applied» while the data it hides is still there to read.
 *
 * Display names arrive already shortened. The storefront never sees a full
 * name, because a name that reaches the page can be read out of the HTML
 * whatever the component chose to render.
 */
import {
  reviewPageSchema,
  type ProductReview,
  type RatingSummary,
  type ReviewPage,
  type ReviewQuery,
} from '@sharghigold/contracts';

/** Thrown when a review page cannot be produced in the shape the contract promises. */
export class ReviewContractError extends Error {
  constructor(detail: string) {
    super(`Review page did not match the contract: ${detail}`);
    this.name = 'ReviewContractError';
  }
}

/* -------------------------------------------------------------------------- */
/* Fixture                                                                    */
/* -------------------------------------------------------------------------- */

interface ProductReviews {
  readonly reviews: readonly ProductReview[];
  /** Aggregate score per aspect, as the API would return it. */
  readonly aspects: readonly {
    readonly aspect: 'build-quality' | 'photo-match' | 'value';
    readonly average: string;
  }[];
}

const SOLITAIRE_REVIEWS: readonly ProductReview[] = [
  {
    id: 'rv-10482-01',
    authorDisplayName: 'مریم ر.',
    stars: 5,
    title: 'دقیقاً مطابق تصویر',
    body: 'دقیقاً همون چیزی بود که تو عکس دیدم. وزن و عیارش با فاکتور کامل می‌خوره و جعبه‌بندی خیلی مرتب بود.',
    publishedAt: '2026-08-27T11:20:00.000Z',
    verifiedPurchase: true,
    photos: [{ id: 'rv-10482-01-a' }, { id: 'rv-10482-01-b' }],
    helpfulCount: 24,
    sellerReply: null,
  },
  {
    id: 'rv-10482-02',
    authorDisplayName: 'سهیل ک.',
    stars: 4,
    title: 'هدیه‌ای که پسندید',
    body: 'برای هدیه نامزدی گرفتم و خیلی پسندید. سایز ۵۴ کمی تنگ بود، پیشنهاد می‌کنم قبل خرید سایز را دقیق اندازه بگیرید.',
    publishedAt: '2026-08-10T08:05:00.000Z',
    verifiedPurchase: true,
    photos: [],
    helpfulCount: 16,
    sellerReply: {
      body: 'ممنون از بازخورد شما. تغییر سایز رکاب تا دو شماره در کارگاه زرنما رایگان انجام می‌شود؛ کافی است با پشتیبانی تماس بگیرید.',
      publishedAt: '2026-08-11T09:40:00.000Z',
    },
  },
  {
    id: 'rv-10482-03',
    authorDisplayName: 'نگار الف.',
    stars: 5,
    title: 'پرداخت آینه‌ای بی‌نقص',
    body: 'رکاب باریک و سبک است و برای استفاده روزمره اذیت نمی‌کند. نگین محکم نشسته و بعد از یک ماه هیچ لقی ندارد.',
    publishedAt: '2026-08-05T17:30:00.000Z',
    verifiedPurchase: true,
    photos: [{ id: 'rv-10482-03-a' }],
    helpfulCount: 31,
    sellerReply: null,
  },
  {
    id: 'rv-10482-04',
    authorDisplayName: 'فرهاد ن.',
    stars: 3,
    title: 'ارسال کمی طول کشید',
    body: 'کالا سالم و مطابق توضیحات بود اما ارسال یک روز بیشتر از زمان اعلامی طول کشید.',
    publishedAt: '2026-07-12T13:15:00.000Z',
    verifiedPurchase: true,
    photos: [],
    helpfulCount: 9,
    sellerReply: {
      body: 'بابت تأخیر عذرخواهی می‌کنیم. سفارش شما در بازه پیک تقاضا ثبت شده بود؛ اکنون ارسال تهران به کمتر از ۲۴ ساعت رسیده است.',
      publishedAt: '2026-07-13T07:00:00.000Z',
    },
  },
  {
    id: 'rv-10482-05',
    authorDisplayName: 'شیما ل.',
    stars: 5,
    title: 'فاکتور رسمی و برچسب اصالت',
    body: 'فاکتور رسمی و برچسب اصالت همراه کالا بود. برای خرید طلا آنلاین، همین دو مورد خیال آدم را راحت می‌کند.',
    publishedAt: '2026-07-03T10:00:00.000Z',
    verifiedPurchase: true,
    photos: [{ id: 'rv-10482-05-a' }, { id: 'rv-10482-05-b' }],
    helpfulCount: 19,
    sellerReply: null,
  },
  {
    id: 'rv-10482-06',
    authorDisplayName: 'امید ص.',
    stars: 4,
    title: 'ارزش خرید خوب',
    body: 'اجرت ساخت نسبت به بازار منصفانه بود و در محاسبه قیمت همه اقلام شفاف نوشته شده.',
    publishedAt: '2026-06-14T19:45:00.000Z',
    verifiedPurchase: true,
    photos: [],
    helpfulCount: 7,
    sellerReply: null,
  },
];

const BAND_REVIEWS: readonly ProductReview[] = [
  {
    id: 'rv-10231-01',
    authorDisplayName: 'الهام ب.',
    stars: 5,
    title: 'سبک و راحت',
    body: 'برای استفاده هر روز عالی است. اصلاً سنگینی نمی‌کند و رنگش بعد از دو ماه تغییری نکرده.',
    publishedAt: '2026-08-19T12:00:00.000Z',
    verifiedPurchase: true,
    photos: [],
    helpfulCount: 11,
    sellerReply: null,
  },
  {
    id: 'rv-10231-02',
    authorDisplayName: 'رضا ک.',
    stars: 4,
    title: 'مطابق انتظار',
    body: 'کیفیت ساخت خوب است. کاش پهنای بیشتری هم موجود بود تا بشود چند رینگ کنار هم پوشید.',
    publishedAt: '2026-07-28T15:25:00.000Z',
    verifiedPurchase: true,
    photos: [],
    helpfulCount: 4,
    sellerReply: null,
  },
];

const REVIEWS_BY_SLUG = new Map<string, ProductReviews>([
  [
    'classic-solitaire-ring',
    {
      reviews: SOLITAIRE_REVIEWS,
      aspects: [
        { aspect: 'build-quality', average: '4.9' },
        { aspect: 'photo-match', average: '4.8' },
        { aspect: 'value', average: '4.6' },
      ],
    },
  ],
  [
    'delicate-band-ring',
    {
      reviews: BAND_REVIEWS,
      aspects: [
        { aspect: 'build-quality', average: '4.7' },
        { aspect: 'photo-match', average: '4.8' },
        { aspect: 'value', average: '4.9' },
      ],
    },
  ],
]);

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

const MATCHES: Record<ReviewQuery['filter'], (review: ProductReview) => boolean> = {
  all: () => true,
  'five-star': (review) => review.stars === 5,
  'with-photos': (review) => review.photos.length > 0,
  critical: (review) => review.stars <= 3,
  answered: (review) => review.sellerReply !== null,
};

/**
 * One page of reviews for a product.
 *
 * `total` counts every published review whatever the filter, so the page can
 * say how many of the whole set it is showing; `matched` counts what the filter kept, so the
 * «more» button knows whether there is more. Deriving either in the browser
 * from a truncated list would give a number that is wrong by exactly the
 * amount that was hidden.
 */
export async function getReviewPage(slug: string, query: ReviewQuery): Promise<ReviewPage> {
  const stored = REVIEWS_BY_SLUG.get(slug);
  const all = stored?.reviews ?? [];

  const matched = all.filter(MATCHES[query.filter]);

  // `toSorted`, not `sort`: the fixture is shared across every request in the
  // process, and sorting it in place would let one request change what the
  // next one sees.
  const ordered =
    query.sort === 'helpful'
      ? matched.toSorted((a, b) => b.helpfulCount - a.helpfulCount)
      : matched.toSorted((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const candidate = {
    reviews: ordered.slice(0, query.limit),
    matched: matched.length,
    total: all.length,
    aspects: stored?.aspects ?? [],
  };

  const parsed = reviewPageSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new ReviewContractError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }

  return parsed.data;
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The star distribution and mean for a product, counted from its reviews.
 *
 * Derived rather than stored, and derived here rather than on the product,
 * because the reviews are the only thing that can make it true. A stored
 * average is a number that can disagree with the list underneath it, and
 * nobody ever notices that it has.
 *
 * The mean is computed in integers and rounded once, at one decimal place:
 * `26 / 6` in floating point is 4.333333333333333, and the only thing anyone
 * wants from that is «۴٫۳».
 */
export function getRatingSummary(slug: string): RatingSummary {
  const reviews = REVIEWS_BY_SLUG.get(slug)?.reviews ?? [];

  const buckets = ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: reviews.filter((review) => review.stars === stars).length,
  }));

  const total = reviews.length;
  const stars = reviews.reduce((sum, review) => sum + review.stars, 0);
  const tenths = total === 0 ? 0 : Math.round((stars * 10) / total);

  return {
    average: `${Math.trunc(tenths / 10)}.${tenths % 10}`,
    total,
    buckets,
  };
}
