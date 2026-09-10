/**
 * PLACEHOLDER CONTENT.
 *
 * The ring family, written out in full so the product page can be built and
 * reviewed before `GET /api/v1/products/:slug` exists. It is deleted the day
 * that endpoint is real; nothing here is persisted, and nothing above
 * `product.ts` imports it.
 *
 * Two things it deliberately does not carry.
 *
 * **No prices.** Each piece holds its weight, its purity and the rates that
 * apply to it, and the figure is derived on the server by `pricing.ts`. The
 * design canvas has a final toman number baked in; copying it would have
 * hidden the thing this page most needs to prove.
 *
 * **No ratings.** The star distribution and the mean are counted from the
 * reviews themselves, in `reviews.ts`. A stored average is a number that can
 * disagree with the list underneath it, and nobody ever notices that it has.
 */
import type { ProductSize, SizeGuideRow } from '@sharghigold/contracts';

/* -------------------------------------------------------------------------- */
/* Shared shapes                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The shop's ring sizes and their circumference in millimetres.
 *
 * One table, not one per product: ring sizing is an industry standard, and a
 * per-product copy is a per-product opportunity to get it wrong.
 */
export const RING_SIZE_GUIDE: readonly SizeGuideRow[] = [
  { size: 52, circumferenceMillimetres: '52.5' },
  { size: 54, circumferenceMillimetres: '54.4' },
  { size: 56, circumferenceMillimetres: '56.3' },
  { size: 58, circumferenceMillimetres: '58.3' },
  { size: 60, circumferenceMillimetres: '60.2' },
  { size: 62, circumferenceMillimetres: '62.1' },
];

const ringSizes = (unavailable: readonly number[]): readonly ProductSize[] =>
  RING_SIZE_GUIDE.map((row) => ({
    value: row.size,
    available: !unavailable.includes(row.size),
  }));

/** سود فروشنده — the retailer's margin, in basis points. */
const PROFIT_BASIS_POINTS = 700;

/** مالیات بر ارزش افزوده — VAT, in basis points. */
const VAT_BASIS_POINTS = 900;

/**
 * The category trail above every ring, without «خانه» and «دسته‌بندی‌ها».
 *
 * Those two are storefront chrome — they are the same on every page and their
 * URLs are the storefront's own — so the trail here starts at the catalogue
 * and the component prepends the rest.
 */
const RING_BREADCRUMB = [{ label: 'انگشتر', categorySlug: 'rings' }] as const;

/* -------------------------------------------------------------------------- */
/* The catalogue                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A product before the gateway parses it.
 *
 * Weight is grams as an exact decimal string, converted to whole milligrams on
 * the way through. Everything else is already the shape the contract asks for.
 */
export interface ProductFixture {
  readonly slug: string;
  readonly sku: string;
  readonly title: string;
  readonly latinTitle: string | null;
  readonly leafCrumb: string;
  readonly media: readonly { readonly id: string; readonly alt: string }[];
  readonly grams: string;
  readonly toleranceGrams: string;
  readonly karat: 18 | 21 | 22 | 24;
  readonly makingFeeBasisPoints: number;
  readonly colours: readonly {
    readonly colour: 'yellow' | 'rose' | 'white';
    readonly label: string;
    readonly available: boolean;
  }[];
  readonly unavailableSizes: readonly number[];
  readonly specs: readonly { readonly key: string; readonly value: string }[];
  readonly description: string;
  readonly unitsSold: number;
  readonly inStock: boolean;
  readonly installmentEligible: boolean;
  readonly relatedSlugs: readonly string[];
}

const GOLD_COLOURS = [
  { colour: 'yellow', label: 'زرد', available: true },
  { colour: 'rose', label: 'رزگلد', available: true },
  { colour: 'white', label: 'سفید', available: true },
] as const;

export const PRODUCT_FIXTURES: readonly ProductFixture[] = [
  {
    slug: 'classic-solitaire-ring',
    sku: 'ZN-10482',
    title: 'انگشتر طلا ۱۸ عیار تک‌نگین کلاسیک',
    latinTitle: 'Zarnama Solitaire Ring',
    leafCrumb: 'تک‌نگین',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر تک‌نگین از روبه‌رو' },
      { id: 'side', alt: 'نمای جانبی رکاب و پایه نگین' },
      { id: 'on-hand', alt: 'انگشتر روی دست' },
      { id: 'packaging', alt: 'جعبه مخملی و فاکتور رسمی همراه کالا' },
    ],
    grams: '2.80',
    toleranceGrams: '0.05',
    karat: 18,
    makingFeeBasisPoints: 1_800,
    colours: GOLD_COLOURS,
    unavailableSizes: [58, 62],
    specs: [
      { key: 'عیار', value: '۱۸ عیار (۷۵۰)' },
      { key: 'وزن', value: '۲٫۸۰ گرم (± ۰٫۰۵)' },
      { key: 'رنگ', value: 'طلای زرد' },
      { key: 'نوع نگین', value: 'سنگ CZ برلیان‌تراش' },
      { key: 'پهنای رکاب', value: '۱٫۸ میلی‌متر' },
      { key: 'مناسب برای', value: 'نامزدی، هدیه، استفاده روزمره' },
      { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
      { key: 'بسته‌بندی', value: 'جعبه مخملی + فاکتور رسمی' },
      { key: 'کد کالا', value: 'ZN-۱۰۴۸۲' },
    ],
    description:
      'انگشتر تک‌نگین کلاسیک با رکاب باریک و نگین برلیان‌تراش در مرکز ساخته شده است؛ طرحی که سال‌هاست انتخاب اول برای هدیه و نامزدی است. رکاب از طلای ۱۸ عیار با آبکاری رودیوم محافظ و پرداخت آینه‌ای اجرا شده و نگین در چهار پایه محکم نشسته تا در استفاده روزمره ایمن بماند. این محصول با جعبه مخملی، فاکتور رسمی و برچسب اصالت ارسال می‌شود.',
    unitsSold: 310,
    inStock: true,
    installmentEligible: true,
    relatedSlugs: [
      'delicate-band-ring',
      'stone-set-dress-ring',
      'paired-wedding-bands',
      'rose-gold-solitaire-ring',
    ],
  },
  {
    slug: 'delicate-band-ring',
    sku: 'ZN-10231',
    title: 'انگشتر رینگ ظریف',
    latinTitle: 'Zarnama Slim Band',
    leafCrumb: 'رینگ',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر رینگ ظریف' },
      { id: 'on-hand', alt: 'انگشتر رینگ روی دست' },
    ],
    grams: '1.60',
    toleranceGrams: '0.05',
    karat: 18,
    makingFeeBasisPoints: 1_400,
    colours: GOLD_COLOURS,
    unavailableSizes: [62],
    specs: [
      { key: 'عیار', value: '۱۸ عیار (۷۵۰)' },
      { key: 'وزن', value: '۱٫۶۰ گرم (± ۰٫۰۵)' },
      { key: 'پهنای رکاب', value: '۱٫۲ میلی‌متر' },
      { key: 'مناسب برای', value: 'استفاده روزمره، هم‌پوشانی با انگشترهای دیگر' },
      { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
      { key: 'کد کالا', value: 'ZN-۱۰۲۳۱' },
    ],
    description:
      'رینگ ساده و باریک از طلای ۱۸ عیار، با پرداخت آینه‌ای و بدون نگین. سبک است و برای استفاده هر روزه یا کنار هم پوشیدن چند رینگ ساخته شده است.',
    unitsSold: 186,
    inStock: true,
    installmentEligible: true,
    relatedSlugs: ['classic-solitaire-ring', 'rose-gold-solitaire-ring', 'paired-wedding-bands'],
  },
  {
    slug: 'stone-set-dress-ring',
    sku: 'ZN-10796',
    title: 'انگشتر سنگ‌دار مجلسی',
    latinTitle: 'Zarnama Dress Ring',
    leafCrumb: 'مجلسی',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر سنگ‌دار مجلسی' },
      { id: 'detail', alt: 'جزئیات نگین‌های کنار رکاب' },
      { id: 'on-hand', alt: 'انگشتر مجلسی روی دست' },
    ],
    grams: '4.10',
    toleranceGrams: '0.08',
    karat: 18,
    makingFeeBasisPoints: 2_100,
    colours: GOLD_COLOURS,
    unavailableSizes: [52],
    specs: [
      { key: 'عیار', value: '۱۸ عیار (۷۵۰)' },
      { key: 'وزن', value: '۴٫۱۰ گرم (± ۰٫۰۸)' },
      { key: 'نوع نگین', value: 'سنگ CZ، نشان‌شده روی رکاب' },
      { key: 'مناسب برای', value: 'مجالس و مناسبت‌ها' },
      { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
      { key: 'کد کالا', value: 'ZN-۱۰۷۹۶' },
    ],
    description:
      'انگشتر مجلسی با نگین مرکزی درشت و نگین‌های ریز روی رکاب. اجرت ساخت این طرح بالاتر از رینگ ساده است، چون نشان‌کاری نگین‌ها با دست انجام می‌شود.',
    unitsSold: 94,
    inStock: true,
    installmentEligible: true,
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },
  {
    slug: 'paired-wedding-bands',
    sku: 'ZN-11044',
    title: 'حلقه ازدواج جفتی',
    latinTitle: 'Zarnama Wedding Pair',
    leafCrumb: 'حلقه ازدواج',
    media: [
      { id: 'pair', alt: 'جفت حلقه ازدواج کنار هم' },
      { id: 'engraving', alt: 'حکاکی داخل حلقه' },
    ],
    grams: '6.30',
    toleranceGrams: '0.10',
    karat: 18,
    makingFeeBasisPoints: 1_600,
    colours: [
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: true },
      { colour: 'rose', label: 'رزگلد', available: false },
    ],
    unavailableSizes: [],
    specs: [
      { key: 'عیار', value: '۱۸ عیار (۷۵۰)' },
      { key: 'وزن مجموع', value: '۶٫۳۰ گرم (± ۰٫۱۰)' },
      { key: 'تعداد', value: 'دو حلقه، زنانه و مردانه' },
      { key: 'حکاکی', value: 'رایگان، تا ۱۲ نویسه در هر حلقه' },
      { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
      { key: 'کد کالا', value: 'ZN-۱۱۰۴۴' },
    ],
    description:
      'جفت حلقه ازدواج با رکاب صاف و پرداخت مات، همراه با حکاکی رایگان داخل حلقه. حکاکی محصول را سفارشی می‌کند و پس از آن مشمول مرجوعی نیست.',
    unitsSold: 61,
    inStock: true,
    installmentEligible: true,
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },
  {
    slug: 'rose-gold-solitaire-ring',
    sku: 'ZN-10518',
    title: 'انگشتر تک‌نگین رزگلد',
    latinTitle: 'Zarnama Rose Solitaire',
    leafCrumb: 'تک‌نگین رزگلد',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر تک‌نگین رزگلد' },
      { id: 'side', alt: 'نمای جانبی رکاب رزگلد' },
    ],
    grams: '2.50',
    toleranceGrams: '0.05',
    karat: 18,
    makingFeeBasisPoints: 1_900,
    colours: [
      { colour: 'rose', label: 'رزگلد', available: true },
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: false },
    ],
    unavailableSizes: [60, 62],
    specs: [
      { key: 'عیار', value: '۱۸ عیار (۷۵۰)' },
      { key: 'وزن', value: '۲٫۵۰ گرم (± ۰٫۰۵)' },
      { key: 'رنگ', value: 'طلای رزگلد' },
      { key: 'نوع نگین', value: 'سنگ CZ برلیان‌تراش' },
      { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
      { key: 'کد کالا', value: 'ZN-۱۰۵۱۸' },
    ],
    description:
      'همان طرح تک‌نگین کلاسیک با آلیاژ رزگلد. رنگ گرم‌تر رکاب، نگین را روشن‌تر نشان می‌دهد و برای پوست‌های روشن انتخاب رایج‌تری است.',
    unitsSold: 128,
    inStock: false,
    installmentEligible: true,
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },
];

export { RING_BREADCRUMB, PROFIT_BASIS_POINTS, VAT_BASIS_POINTS, ringSizes };
