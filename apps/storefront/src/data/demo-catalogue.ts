/**
 * PLACEHOLDER CONTENT.
 *
 * This is not a catalogue and not an API. It is a fixed set of products used
 * to build and review the homepage before the catalogue service exists, and it
 * is deleted the moment `GET /api/v1/products` is real. Nothing here is
 * persisted, priced authoritatively, or shown to a customer.
 *
 * What it deliberately does NOT do is carry prices.
 *
 * The design canvas has a final toman figure baked into each card. Copying
 * those would have hidden the thing this page most needs to prove: that a
 * price shown to a customer is derived, on the server, from a weight and a
 * gold rate by `@sharghigold/money` — never typed in, never sent by a client,
 * never a float. So each product carries what actually determines its price:
 * weight, purity, and the fee rates that apply to it. The figures on the page
 * are computed, and they differ from the canvas because the canvas numbers
 * were illustrative.
 *
 * The same reasoning applies to discounts. In this trade a discount is a
 * reduction in the making fee (اجرت) — the gold itself is worth what gold is
 * worth, and no shop discounts it. So a promotion here is a lower making-fee
 * rate, and the percentage a customer sees is derived from the difference
 * between the two totals rather than asserted.
 */

export interface DemoProduct {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  /** Weight in grams, as an exact decimal string. Parsed, never floated. */
  readonly grams: string;
  readonly karat: 18 | 21 | 22 | 24;
  /** اجرت — the workshop's making fee, in basis points of the gold value. */
  readonly makingFeeBasisPoints: number;
  /** A promotional making fee, when the piece is on offer. */
  readonly promotionalMakingFeeBasisPoints?: number;
  /** Whether the piece is offered on an installment plan. */
  readonly installment?: boolean;
  readonly inStock?: boolean;
}

/** سود فروشنده — the retailer's margin, in basis points. */
export const DEMO_PROFIT_BASIS_POINTS = 700;

/** مالیات بر ارزش افزوده — VAT, in basis points. */
export const DEMO_VAT_BASIS_POINTS = 1_000;

export const DEMO_NEW_ARRIVALS: readonly DemoProduct[] = [
  {
    slug: 'star-drop-earrings',
    title: 'گوشواره آویز ستاره',
    category: 'گوشواره',
    grams: '2.1',
    karat: 18,
    makingFeeBasisPoints: 1_500,
  },
  {
    slug: 'delicate-butterfly-necklace',
    title: 'گردنبند پروانه ظریف',
    category: 'گردنبند',
    grams: '1.8',
    karat: 18,
    makingFeeBasisPoints: 1_500,
  },
  {
    slug: 'cartier-chain-bracelet',
    title: 'دستبند زنجیری کارتیه',
    category: 'دستبند',
    grams: '3.2',
    karat: 18,
    makingFeeBasisPoints: 1_400,
  },
  {
    slug: 'plain-hoop-earrings',
    title: 'گوشواره حلقه‌ای ساده',
    category: 'گوشواره',
    grams: '1.4',
    karat: 18,
    makingFeeBasisPoints: 1_300,
  },
  {
    slug: 'woven-single-bangle',
    title: 'النگو حصیری تک‌پوش',
    category: 'النگو',
    grams: '4.6',
    karat: 18,
    makingFeeBasisPoints: 1_600,
  },
];

export const DEMO_OFFERS: readonly DemoProduct[] = [
  {
    slug: 'full-jewellery-set',
    title: 'سرویس کامل ژوپینگ',
    category: 'سرویس و نیم‌ست',
    grams: '8.2',
    karat: 18,
    makingFeeBasisPoints: 1_800,
    promotionalMakingFeeBasisPoints: 1_100,
  },
  {
    slug: 'twisted-hoop-earrings',
    title: 'گوشواره حلقه‌ای پیچ',
    category: 'گوشواره',
    grams: '2.7',
    karat: 18,
    makingFeeBasisPoints: 1_700,
    promotionalMakingFeeBasisPoints: 1_200,
  },
  {
    slug: 'leather-and-gold-bracelet',
    title: 'دستبند چرم و طلا',
    category: 'دستبند',
    grams: '1.9',
    karat: 18,
    makingFeeBasisPoints: 2_000,
    promotionalMakingFeeBasisPoints: 1_200,
  },
  {
    slug: 'marshal-single-bangle',
    title: 'النگو تک‌پوش مارشال',
    category: 'النگو',
    grams: '3.4',
    karat: 18,
    makingFeeBasisPoints: 1_600,
    promotionalMakingFeeBasisPoints: 1_150,
  },
];

export const DEMO_BEST_SELLERS: readonly DemoProduct[] = [
  {
    slug: 'rose-gold-heart-half-set',
    title: 'نیم‌ست قلب رزگلد',
    category: 'سرویس و نیم‌ست',
    grams: '5.1',
    karat: 18,
    makingFeeBasisPoints: 1_700,
    installment: true,
  },
  {
    slug: 'six-piece-bangle-set',
    title: 'النگو النگویی شش‌پوش',
    category: 'النگو',
    grams: '12.4',
    karat: 18,
    makingFeeBasisPoints: 1_500,
    installment: true,
  },
  {
    slug: 'name-plate-necklace',
    title: 'گردنبند پلاک اسم',
    category: 'گردنبند',
    grams: '2.3',
    karat: 18,
    makingFeeBasisPoints: 1_900,
  },
  {
    slug: 'pearl-stud-earrings',
    title: 'گوشواره میخی مروارید',
    category: 'گوشواره',
    grams: '1.6',
    karat: 18,
    makingFeeBasisPoints: 1_800,
  },
  {
    slug: 'braided-sport-bracelet',
    title: 'دستبند اسپرت بافت',
    category: 'دستبند',
    grams: '6.8',
    karat: 18,
    makingFeeBasisPoints: 1_450,
    installment: true,
  },
  {
    slug: 'venetian-chain-necklace',
    title: 'گردنبند زنجیر ونیزی',
    category: 'گردنبند',
    grams: '3.9',
    karat: 18,
    makingFeeBasisPoints: 1_350,
  },
  {
    slug: 'classic-solitaire-ring',
    title: 'انگشتر تک‌نگین کلاسیک',
    category: 'انگشتر',
    grams: '2.8',
    karat: 18,
    makingFeeBasisPoints: 2_100,
  },
];

/** Filter chips above the best-sellers grid. «همه» is the unfiltered state. */
export const DEMO_CATEGORY_FILTERS = [
  'همه',
  'انگشتر',
  'گوشواره',
  'گردنبند',
  'النگو',
  'دستبند',
  'سرویس و نیم‌ست',
] as const;

export interface DemoArticle {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  /** Already a Persian-calendar date string; no conversion happens here. */
  readonly published: string;
  readonly readingMinutes: number;
}

export const DEMO_ARTICLES: readonly DemoArticle[] = [
  {
    slug: 'gold-price-outlook',
    category: 'تحلیل بازار',
    title: 'قیمت طلا در نیمه دوم ۱۴۰۵ به کدام سمت می‌رود؟',
    published: '۱۲ مرداد ۱۴۰۵',
    readingMinutes: 9,
  },
  {
    slug: 'coin-bullion-or-melt',
    category: 'راهنمای خرید',
    title: 'سکه، آب‌شده یا شمش؟ راهنمای انتخاب بر اساس بودجه',
    published: '۸ مرداد ۱۴۰۵',
    readingMinutes: 7,
  },
  {
    slug: 'spotting-fake-gold',
    category: 'تشخیص اصالت',
    title: 'پنج آزمون خانگی برای تشخیص طلای تقلبی',
    published: '۳ مرداد ۱۴۰۵',
    readingMinutes: 6,
  },
  {
    slug: 'how-installments-work',
    category: 'خرید اقساطی',
    title: 'خرید اقساطی طلا چطور کار می‌کند؟ از درخواست تا تحویل',
    published: '۲۸ تیر ۱۴۰۵',
    readingMinutes: 8,
  },
];
