/**
 * PLACEHOLDER CONTENT — the whole catalogue, in one file.
 *
 * Every piece the shop sells is written out here so the storefront can be
 * built and reviewed before `GET /api/v1/products` exists. It is deleted the
 * day that endpoint is real; nothing here is persisted and nothing above
 * `product.ts` and `listing.ts` imports it.
 *
 * There used to be two of these. The homepage read `data/demo-catalogue.ts`
 * and the product page read this file, and the two shared exactly one slug —
 * so sixteen of the seventeen product cards on the homepage linked to a 404.
 * Two seeds for one catalogue is the same bug as two tables for one entity,
 * and it fails the same way: silently, on the path a customer actually takes.
 *
 * Three things this file deliberately does not carry.
 *
 * **No prices.** Each piece holds its weight, its purity and the fee rates
 * that apply to it, and the figure is derived on the server by `pricing.ts`.
 * The design canvas has a final toman number baked in; copying it would have
 * hidden the thing the catalogue most needs to prove.
 *
 * **No ratings.** The star distribution and the mean are counted from the
 * reviews themselves, in `reviews.ts`. A stored average is a number that can
 * disagree with the list underneath it, and nobody ever notices that it has.
 *
 * **No discount percentages.** In this trade a discount is a reduction in the
 * making fee (اجرت) — the gold itself is worth what gold is worth, and no shop
 * discounts it. So a promotion is a lower making-fee rate, and the percentage
 * a customer sees is derived from the difference between the two totals.
 */
import type { ProductSize, SizeGuideRow } from '@sharghigold/contracts';

import { CATALOGUE_RATES } from '@/server/policy/shop-policy';

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

/**
 * The shop's default margin and tax rates.
 *
 * Read from the policy module rather than declared here, because they are the
 * shop's terms and not a property of any one ring. A piece may override them —
 * the contract has both per product — but nothing in this catalogue does, and
 * a catalogue where every row repeats the VAT rate is a catalogue where one
 * row eventually disagrees.
 */
const PROFIT_BASIS_POINTS = CATALOGUE_RATES.profitBasisPoints;
const VAT_BASIS_POINTS = CATALOGUE_RATES.vatBasisPoints;

const GOLD_COLOURS = [
  { colour: 'yellow', label: 'زرد', available: true },
  { colour: 'rose', label: 'رزگلد', available: true },
  { colour: 'white', label: 'سفید', available: true },
] as const;

/* -------------------------------------------------------------------------- */
/* The fixture shape                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A product before the gateway parses it.
 *
 * Weight is grams as an exact decimal string, converted to whole milligrams on
 * the way through. Everything else is already the shape the contract asks for,
 * except the four fields the *listing* needs and a single product page does
 * not: which category it hangs under, when it was listed, what collections it
 * belongs to, and the promotional fee that makes it an offer.
 */
export interface ProductFixture {
  readonly slug: string;
  readonly sku: string;
  readonly title: string;
  readonly latinTitle: string | null;
  /**
   * The category this piece belongs to, as a taxonomy slug.
   *
   * This is what makes a listing possible at all. It is a top-level slug —
   * `rings`, `earrings` — and the listing widens a child slug such as
   * `rings-solitaire` to its parent before matching, so a facet tile that
   * names a sub-type still finds stock.
   */
  readonly categorySlug: string;
  /**
   * The sub-type tile this piece sits under, e.g. `rings-solitaire`.
   *
   * Sub-types are not categories — they are tiles a merchandiser adds to a
   * group — so this is a reference into the taxonomy rather than a second
   * category field. It is both what `/categories/rings-solitaire` filters on
   * and where the last crumb of the breadcrumb comes from, so the trail and
   * the filter cannot name the piece differently.
   */
  readonly subTypeSlug: string;
  readonly media: readonly { readonly id: string; readonly alt: string }[];
  readonly grams: string;
  readonly toleranceGrams: string;
  readonly karat: 18 | 21 | 22 | 24;
  readonly makingFeeBasisPoints: number;
  /** A reduced making fee while the piece is on offer. */
  readonly promotionalMakingFeeBasisPoints?: number;
  readonly colours: readonly {
    readonly colour: 'yellow' | 'rose' | 'white';
    readonly label: string;
    readonly available: boolean;
  }[];
  /** Ring sizes the workshop cannot currently supply. Empty for unsized pieces. */
  readonly unavailableSizes: readonly number[];
  /** Whether the piece is ordered by ring size at all. */
  readonly sized: boolean;
  readonly specs: readonly { readonly key: string; readonly value: string }[];
  readonly description: string;
  readonly unitsSold: number;
  readonly inStock: boolean;
  readonly installmentEligible: boolean;
  /** Curated collections this piece appears in, e.g. `weekly-sale`. */
  readonly collections: readonly string[];
  /** When the piece was first listed. Orders «نو رسیده‌ها». */
  readonly listedAt: string;
  readonly relatedSlugs: readonly string[];
}

/* -------------------------------------------------------------------------- */
/* Specification helpers                                                      */
/* -------------------------------------------------------------------------- */

type Spec = { readonly key: string; readonly value: string };

/**
 * The rows every piece carries, in the order the design prints them: purity
 * and weight first, the piece's own rows next, provenance and article number
 * last.
 *
 * Written once rather than copied into twenty products. «۱۸ عیار (۷۵۰)» is the
 * same sentence every time, and twenty copies is twenty chances for one of
 * them to say ۷۵۱.
 */
function leadSpecs(karat: ProductFixture['karat'], persianWeight: string): readonly Spec[] {
  const purity = karat === 18 ? '۷۵۰' : karat === 21 ? '۸۷۵' : karat === 22 ? '۹۱۶' : '۹۹۹';

  return [
    { key: 'عیار', value: `${toPersianNumber(karat)} عیار (${purity})` },
    { key: 'وزن', value: persianWeight },
  ];
}

function tailSpecs(sku: string): readonly Spec[] {
  return [
    { key: 'ساخت', value: 'ایران — کارگاه زرنما' },
    { key: 'بسته‌بندی', value: 'جعبه مخملی + فاکتور رسمی' },
    { key: 'کد کالا', value: toPersianSku(sku) },
  ];
}

/** Latin digits to Persian, for the spec table only. */
function toPersianNumber(value: number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
}

/** «ZN-10482» → «ZN-۱۰۴۸۲». The prefix stays Latin; it is read down a phone. */
function toPersianSku(sku: string): string {
  return sku.replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
}

/* -------------------------------------------------------------------------- */
/* The catalogue                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One entry before its shared specification rows are prepended.
 *
 * `specs` here are the rows specific to the piece; `baseSpecs` supplies عیار,
 * وزن, ساخت, بسته‌بندی and کد کالا around them.
 */
type Seed = Omit<ProductFixture, 'specs'> & {
  readonly persianWeight: string;
  readonly extraSpecs: readonly Spec[];
};

const SEEDS: readonly Seed[] = [
  /* ---------------------------------------------------------------- rings -- */
  {
    slug: 'classic-solitaire-ring',
    sku: 'ZN-10482',
    title: 'انگشتر طلا ۱۸ عیار تک‌نگین کلاسیک',
    latinTitle: 'Zarnama Solitaire Ring',
    categorySlug: 'rings',
    subTypeSlug: 'rings-solitaire',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر تک‌نگین از روبه‌رو' },
      { id: 'side', alt: 'نمای جانبی رکاب و پایه نگین' },
      { id: 'on-hand', alt: 'انگشتر روی دست' },
      { id: 'packaging', alt: 'جعبه مخملی و فاکتور رسمی همراه کالا' },
    ],
    grams: '2.80',
    toleranceGrams: '0.05',
    persianWeight: '۲٫۸۰ گرم (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_800,
    colours: GOLD_COLOURS,
    unavailableSizes: [58, 62],
    sized: true,
    extraSpecs: [
      { key: 'رنگ', value: 'طلای زرد' },
      { key: 'نوع نگین', value: 'سنگ CZ برلیان‌تراش' },
      { key: 'پهنای رکاب', value: '۱٫۸ میلی‌متر' },
      { key: 'مناسب برای', value: 'نامزدی، هدیه، استفاده روزمره' },
    ],
    description:
      'انگشتر تک‌نگین کلاسیک با رکاب باریک و نگین برلیان‌تراش در مرکز ساخته شده است؛ طرحی که سال‌هاست انتخاب اول برای هدیه و نامزدی است. رکاب از طلای ۱۸ عیار با آبکاری رودیوم محافظ و پرداخت آینه‌ای اجرا شده و نگین در چهار پایه محکم نشسته تا در استفاده روزمره ایمن بماند. این محصول با جعبه مخملی، فاکتور رسمی و برچسب اصالت ارسال می‌شود.',
    unitsSold: 310,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-05-05',
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
    categorySlug: 'rings',
    subTypeSlug: 'rings-slim',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر رینگ ظریف' },
      { id: 'on-hand', alt: 'انگشتر رینگ روی دست' },
    ],
    grams: '1.60',
    toleranceGrams: '0.05',
    persianWeight: '۱٫۶۰ گرم (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_400,
    colours: GOLD_COLOURS,
    unavailableSizes: [62],
    sized: true,
    extraSpecs: [
      { key: 'پهنای رکاب', value: '۱٫۲ میلی‌متر' },
      { key: 'مناسب برای', value: 'استفاده روزمره، هم‌پوشانی با انگشترهای دیگر' },
    ],
    description:
      'رینگ ساده و باریک از طلای ۱۸ عیار، با پرداخت آینه‌ای و بدون نگین. سبک است و برای استفاده هر روزه یا کنار هم پوشیدن چند رینگ ساخته شده است.',
    unitsSold: 186,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-06-21',
    relatedSlugs: ['classic-solitaire-ring', 'rose-gold-solitaire-ring', 'paired-wedding-bands'],
  },
  {
    slug: 'stone-set-dress-ring',
    sku: 'ZN-10796',
    title: 'انگشتر سنگ‌دار مجلسی',
    latinTitle: 'Zarnama Dress Ring',
    categorySlug: 'rings',
    subTypeSlug: 'rings-gemstone',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر سنگ‌دار مجلسی' },
      { id: 'detail', alt: 'جزئیات نگین‌های کنار رکاب' },
      { id: 'on-hand', alt: 'انگشتر مجلسی روی دست' },
    ],
    grams: '4.10',
    toleranceGrams: '0.08',
    persianWeight: '۴٫۱۰ گرم (± ۰٫۰۸)',
    karat: 18,
    makingFeeBasisPoints: 2_100,
    colours: GOLD_COLOURS,
    unavailableSizes: [52],
    sized: true,
    extraSpecs: [
      { key: 'نوع نگین', value: 'سنگ CZ، نشان‌شده روی رکاب' },
      { key: 'مناسب برای', value: 'مجالس و مناسبت‌ها' },
    ],
    description:
      'انگشتر مجلسی با نگین مرکزی درشت و نگین‌های ریز روی رکاب. اجرت ساخت این طرح بالاتر از رینگ ساده است، چون نشان‌کاری نگین‌ها با دست انجام می‌شود.',
    unitsSold: 94,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-07-12',
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },
  {
    slug: 'paired-wedding-bands',
    sku: 'ZN-11044',
    title: 'حلقه ازدواج جفتی',
    latinTitle: 'Zarnama Wedding Pair',
    categorySlug: 'rings',
    subTypeSlug: 'rings-wedding',
    media: [
      { id: 'pair', alt: 'جفت حلقه ازدواج کنار هم' },
      { id: 'engraving', alt: 'حکاکی داخل حلقه' },
    ],
    grams: '6.30',
    toleranceGrams: '0.10',
    persianWeight: '۶٫۳۰ گرم مجموع (± ۰٫۱۰)',
    karat: 18,
    makingFeeBasisPoints: 1_600,
    colours: [
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: true },
      { colour: 'rose', label: 'رزگلد', available: false },
    ],
    unavailableSizes: [],
    sized: true,
    extraSpecs: [
      { key: 'تعداد', value: 'دو حلقه، زنانه و مردانه' },
      { key: 'حکاکی', value: 'رایگان، تا ۱۲ نویسه در هر حلقه' },
    ],
    description:
      'جفت حلقه ازدواج با رکاب صاف و پرداخت مات، همراه با حکاکی رایگان داخل حلقه. حکاکی محصول را سفارشی می‌کند و پس از آن مشمول مرجوعی نیست.',
    unitsSold: 61,
    inStock: true,
    installmentEligible: true,
    collections: ['bridal'],
    listedAt: '2026-02-14',
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },
  {
    slug: 'rose-gold-solitaire-ring',
    sku: 'ZN-10518',
    title: 'انگشتر تک‌نگین رزگلد',
    latinTitle: 'Zarnama Rose Solitaire',
    categorySlug: 'rings',
    subTypeSlug: 'rings-solitaire',
    media: [
      { id: 'front', alt: 'نمای اصلی انگشتر تک‌نگین رزگلد' },
      { id: 'side', alt: 'نمای جانبی رکاب رزگلد' },
    ],
    grams: '2.50',
    toleranceGrams: '0.05',
    persianWeight: '۲٫۵۰ گرم (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_900,
    colours: [
      { colour: 'rose', label: 'رزگلد', available: true },
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: false },
    ],
    unavailableSizes: [60, 62],
    sized: true,
    extraSpecs: [
      { key: 'رنگ', value: 'طلای رزگلد' },
      { key: 'نوع نگین', value: 'سنگ CZ برلیان‌تراش' },
    ],
    description:
      'همان طرح تک‌نگین کلاسیک با آلیاژ رزگلد. رنگ گرم‌تر رکاب، نگین را روشن‌تر نشان می‌دهد و برای پوست‌های روشن انتخاب رایج‌تری است.',
    unitsSold: 128,
    inStock: false,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-08-25',
    relatedSlugs: ['classic-solitaire-ring', 'delicate-band-ring'],
  },

  /* ------------------------------------------------------------- earrings -- */
  {
    slug: 'star-drop-earrings',
    sku: 'ZN-20114',
    title: 'گوشواره آویز ستاره',
    latinTitle: 'Zarnama Star Drop',
    categorySlug: 'earrings',
    subTypeSlug: 'earrings-drop',
    media: [
      { id: 'front', alt: 'نمای اصلی گوشواره آویز ستاره' },
      { id: 'on-model', alt: 'گوشواره آویز ستاره روی گوش' },
    ],
    grams: '2.10',
    toleranceGrams: '0.05',
    persianWeight: '۲٫۱۰ گرم جفتی (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_500,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول آویز', value: '۲۴ میلی‌متر' },
      { key: 'قفل', value: 'میخی با پشت‌بند فشاری' },
    ],
    description:
      'گوشواره آویز با پلاک ستاره و زنجیر کوتاه. سبک است و وزن آن روی نرمه گوش احساس نمی‌شود، بنابراین برای استفاده طولانی مناسب است.',
    unitsSold: 142,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-08-20',
    relatedSlugs: ['plain-hoop-earrings', 'twisted-hoop-earrings', 'pearl-stud-earrings'],
  },
  {
    slug: 'plain-hoop-earrings',
    sku: 'ZN-20239',
    title: 'گوشواره حلقه‌ای ساده',
    latinTitle: 'Zarnama Plain Hoop',
    categorySlug: 'earrings',
    subTypeSlug: 'earrings-hoop',
    media: [
      { id: 'front', alt: 'نمای اصلی گوشواره حلقه‌ای ساده' },
      { id: 'on-model', alt: 'گوشواره حلقه‌ای روی گوش' },
    ],
    grams: '1.40',
    toleranceGrams: '0.04',
    persianWeight: '۱٫۴۰ گرم جفتی (± ۰٫۰۴)',
    karat: 18,
    makingFeeBasisPoints: 1_300,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'قطر حلقه', value: '۱۵ میلی‌متر' },
      { key: 'قفل', value: 'فنری داخلی' },
    ],
    description:
      'حلقه گرد و بدون نگین با مقطع باریک و پرداخت آینه‌ای. ساده‌ترین گوشواره‌ای که هر روز می‌شود پوشید و کنار گوشواره‌های دیگر هم می‌نشیند.',
    unitsSold: 268,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-07-02',
    relatedSlugs: ['twisted-hoop-earrings', 'star-drop-earrings', 'pearl-stud-earrings'],
  },
  {
    slug: 'twisted-hoop-earrings',
    sku: 'ZN-20351',
    title: 'گوشواره حلقه‌ای پیچ',
    latinTitle: 'Zarnama Twisted Hoop',
    categorySlug: 'earrings',
    subTypeSlug: 'earrings-hoop',
    media: [
      { id: 'front', alt: 'نمای اصلی گوشواره حلقه‌ای پیچ' },
      { id: 'detail', alt: 'جزئیات بافت پیچ روی حلقه' },
    ],
    grams: '2.70',
    toleranceGrams: '0.05',
    persianWeight: '۲٫۷۰ گرم جفتی (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_700,
    promotionalMakingFeeBasisPoints: 1_200,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'قطر حلقه', value: '۲۰ میلی‌متر' },
      { key: 'قفل', value: 'فنری داخلی' },
    ],
    description:
      'حلقه با مقطع پیچ‌خورده که نور را در چند جهت می‌شکند و درشت‌تر از اندازه واقعی‌اش دیده می‌شود. اجرت این طرح در حراج این هفته کاهش یافته است.',
    unitsSold: 97,
    inStock: true,
    installmentEligible: true,
    collections: ['weekly-sale'],
    listedAt: '2026-06-18',
    relatedSlugs: ['plain-hoop-earrings', 'star-drop-earrings'],
  },
  {
    slug: 'pearl-stud-earrings',
    sku: 'ZN-20408',
    title: 'گوشواره میخی مروارید',
    latinTitle: 'Zarnama Pearl Stud',
    categorySlug: 'earrings',
    subTypeSlug: 'earrings-stud',
    media: [
      { id: 'front', alt: 'نمای اصلی گوشواره میخی مروارید' },
      { id: 'on-model', alt: 'گوشواره میخی مروارید روی گوش' },
    ],
    grams: '1.60',
    toleranceGrams: '0.04',
    persianWeight: '۱٫۶۰ گرم جفتی (± ۰٫۰۴)',
    karat: 18,
    makingFeeBasisPoints: 1_800,
    colours: [
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: true },
      { colour: 'rose', label: 'رزگلد', available: false },
    ],
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'نوع نگین', value: 'مروارید پرورشی ۶ میلی‌متری' },
      { key: 'قفل', value: 'میخی با پشت‌بند پیچی' },
    ],
    description:
      'مروارید پرورشی روی پایه طلای ۱۸ عیار، با پشت‌بند پیچی که گوشواره را در طول روز محکم نگه می‌دارد. وزن درج‌شده وزن طلاست و مروارید در آن حساب نشده است.',
    unitsSold: 203,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-05-30',
    relatedSlugs: ['star-drop-earrings', 'plain-hoop-earrings'],
  },

  /* ------------------------------------------------------------ necklaces -- */
  {
    slug: 'delicate-butterfly-necklace',
    sku: 'ZN-30122',
    title: 'گردنبند پروانه ظریف',
    latinTitle: 'Zarnama Butterfly',
    categorySlug: 'necklaces',
    subTypeSlug: 'necklaces-heart-butterfly',
    media: [
      { id: 'front', alt: 'نمای اصلی گردنبند پروانه' },
      { id: 'on-model', alt: 'گردنبند پروانه روی گردن' },
    ],
    grams: '1.80',
    toleranceGrams: '0.04',
    persianWeight: '۱٫۸۰ گرم با زنجیر (± ۰٫۰۴)',
    karat: 18,
    makingFeeBasisPoints: 1_500,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول زنجیر', value: '۴۰ سانتی‌متر با قلاب تنظیم ۴۵' },
      { key: 'اندازه پلاک', value: '۱۲ × ۱۰ میلی‌متر' },
    ],
    description:
      'پلاک پروانه با بال‌های برش‌خورده روی زنجیر نازک. یکی از سبک‌ترین گردنبندهای مجموعه و از پرتکرارترین انتخاب‌ها برای هدیه.',
    unitsSold: 176,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-08-14',
    relatedSlugs: ['name-plate-necklace', 'venetian-chain-necklace'],
  },
  {
    slug: 'name-plate-necklace',
    sku: 'ZN-30266',
    title: 'گردنبند پلاک اسم',
    latinTitle: 'Zarnama Name Plate',
    categorySlug: 'necklaces',
    subTypeSlug: 'necklaces-name-plate',
    media: [
      { id: 'front', alt: 'نمای اصلی گردنبند پلاک اسم' },
      { id: 'detail', alt: 'جزئیات برش حروف روی پلاک' },
    ],
    grams: '2.30',
    toleranceGrams: '0.05',
    persianWeight: '۲٫۳۰ گرم با زنجیر (± ۰٫۰۵)',
    karat: 18,
    makingFeeBasisPoints: 1_900,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول زنجیر', value: '۴۲ سانتی‌متر' },
      { key: 'سفارشی‌سازی', value: 'تا ۸ حرف فارسی یا لاتین' },
      { key: 'مرجوعی', value: 'ندارد — کالای سفارشی‌سازی‌شده' },
    ],
    description:
      'پلاک با برش لیزری نام دلخواه، روی زنجیر ونیزی نازک. چون پلاک برای هر سفارش جداگانه برش می‌خورد، وزن نهایی به تعداد حروف بستگی دارد و در فاکتور دقیق درج می‌شود.',
    unitsSold: 241,
    inStock: true,
    installmentEligible: false,
    collections: [],
    listedAt: '2026-04-11',
    relatedSlugs: ['delicate-butterfly-necklace', 'venetian-chain-necklace'],
  },
  {
    slug: 'venetian-chain-necklace',
    sku: 'ZN-30390',
    title: 'گردنبند زنجیر ونیزی',
    latinTitle: 'Zarnama Venetian Chain',
    categorySlug: 'necklaces',
    subTypeSlug: 'necklaces-venetian',
    media: [
      { id: 'front', alt: 'نمای اصلی زنجیر ونیزی' },
      { id: 'detail', alt: 'جزئیات حلقه‌های زنجیر ونیزی' },
    ],
    grams: '3.90',
    toleranceGrams: '0.07',
    persianWeight: '۳٫۹۰ گرم (± ۰٫۰۷)',
    karat: 18,
    makingFeeBasisPoints: 1_350,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول زنجیر', value: '۴۵ سانتی‌متر' },
      { key: 'قفل', value: 'طوطی‌ای' },
    ],
    description:
      'زنجیر ونیزی با حلقه‌های مکعبی و بافت یکنواخت. بدون پلاک فروخته می‌شود و اجرت آن از طرح‌های پلاک‌دار کمتر است، پس بیشترین بخش قیمت را خود طلا تشکیل می‌دهد.',
    unitsSold: 188,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-03-22',
    relatedSlugs: ['delicate-butterfly-necklace', 'name-plate-necklace'],
  },

  /* ------------------------------------------------------------ bracelets -- */
  {
    slug: 'cartier-chain-bracelet',
    sku: 'ZN-40118',
    title: 'دستبند زنجیری کارتیه',
    latinTitle: 'Zarnama Cartier Link',
    categorySlug: 'bracelets',
    subTypeSlug: 'bracelets-chain',
    media: [
      { id: 'front', alt: 'نمای اصلی دستبند زنجیری کارتیه' },
      { id: 'on-model', alt: 'دستبند کارتیه روی مچ' },
    ],
    grams: '3.20',
    toleranceGrams: '0.06',
    persianWeight: '۳٫۲۰ گرم (± ۰٫۰۶)',
    karat: 18,
    makingFeeBasisPoints: 1_400,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول', value: '۱۸ سانتی‌متر با دو حلقه تنظیم' },
      { key: 'قفل', value: 'طوطی‌ای با زنجیر ایمنی' },
    ],
    description:
      'دستبند با حلقه‌های بیضی کشیده و پرداخت آینه‌ای. زنجیر ایمنی دارد، بنابراین باز شدن قفل به افتادن دستبند منجر نمی‌شود.',
    unitsSold: 154,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-08-05',
    relatedSlugs: ['leather-and-gold-bracelet', 'braided-sport-bracelet'],
  },
  {
    slug: 'leather-and-gold-bracelet',
    sku: 'ZN-40245',
    title: 'دستبند چرم و طلا',
    latinTitle: 'Zarnama Leather Cuff',
    categorySlug: 'bracelets',
    subTypeSlug: 'bracelets-leather',
    media: [
      { id: 'front', alt: 'نمای اصلی دستبند چرم و طلا' },
      { id: 'detail', alt: 'جزئیات اتصال طلا به بند چرم' },
    ],
    grams: '1.90',
    toleranceGrams: '0.04',
    persianWeight: '۱٫۹۰ گرم طلا (± ۰٫۰۴)',
    karat: 18,
    makingFeeBasisPoints: 2_000,
    promotionalMakingFeeBasisPoints: 1_200,
    colours: [
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'rose', label: 'رزگلد', available: true },
      { colour: 'white', label: 'سفید', available: false },
    ],
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'بند', value: 'چرم طبیعی، قابل تعویض' },
      { key: 'طول', value: '۱۷ تا ۲۰ سانتی‌متر' },
      { key: 'مرجوعی', value: 'بند چرم مشمول ضمانت طلا نیست' },
    ],
    description:
      'قطعه طلای ۱۸ عیار روی بند چرم طبیعی، برای کسانی که دستبند سبک‌تر و غیررسمی‌تر می‌خواهند. وزن درج‌شده فقط وزن طلاست و چرم در قیمت طلا حساب نمی‌شود.',
    unitsSold: 88,
    inStock: true,
    installmentEligible: false,
    collections: ['weekly-sale'],
    listedAt: '2026-06-09',
    relatedSlugs: ['cartier-chain-bracelet', 'braided-sport-bracelet'],
  },
  {
    slug: 'braided-sport-bracelet',
    sku: 'ZN-40377',
    title: 'دستبند اسپرت بافت',
    latinTitle: 'Zarnama Braided Sport',
    categorySlug: 'bracelets',
    subTypeSlug: 'bracelets-braided',
    media: [
      { id: 'front', alt: 'نمای اصلی دستبند اسپرت بافت' },
      { id: 'detail', alt: 'جزئیات بافت زنجیر' },
    ],
    grams: '6.80',
    toleranceGrams: '0.10',
    persianWeight: '۶٫۸۰ گرم (± ۰٫۱۰)',
    karat: 18,
    makingFeeBasisPoints: 1_450,
    colours: [
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: true },
      { colour: 'rose', label: 'رزگلد', available: false },
    ],
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'طول', value: '۲۰ سانتی‌متر' },
      { key: 'قفل', value: 'جعبه‌ای با ضامن جانبی' },
    ],
    description:
      'زنجیر بافت پهن با قفل جعبه‌ای، سنگین‌تر از دستبندهای دیگر مجموعه و مناسب مچ‌های درشت‌تر. به دلیل وزن بالاتر، در طرح اقساطی هم عرضه می‌شود.',
    unitsSold: 119,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-02-27',
    relatedSlugs: ['cartier-chain-bracelet', 'six-piece-bangle-set'],
  },

  /* -------------------------------------------------------------- bangles -- */
  {
    slug: 'woven-single-bangle',
    sku: 'ZN-50131',
    title: 'النگو حصیری تک‌پوش',
    latinTitle: 'Zarnama Woven Bangle',
    categorySlug: 'bangles',
    subTypeSlug: 'bangles-woven',
    media: [
      { id: 'front', alt: 'نمای اصلی النگو حصیری' },
      { id: 'detail', alt: 'جزئیات بافت حصیری روی بدنه النگو' },
    ],
    grams: '4.60',
    toleranceGrams: '0.08',
    persianWeight: '۴٫۶۰ گرم (± ۰٫۰۸)',
    karat: 18,
    makingFeeBasisPoints: 1_600,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'سایز', value: 'قطر ۶ (۶۰ میلی‌متر)' },
      { key: 'پهنا', value: '۶ میلی‌متر' },
    ],
    description:
      'النگوی تک با بدنه توخالی و بافت حصیری. توخالی بودن، پهنای بیشتر را با وزن کمتر ممکن می‌کند؛ در عوض در برابر ضربه حساس‌تر است.',
    unitsSold: 132,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-07-29',
    relatedSlugs: ['marshal-single-bangle', 'six-piece-bangle-set'],
  },
  {
    slug: 'marshal-single-bangle',
    sku: 'ZN-50274',
    title: 'النگو تک‌پوش مارشال',
    latinTitle: 'Zarnama Marshal Bangle',
    categorySlug: 'bangles',
    subTypeSlug: 'bangles-single',
    media: [
      { id: 'front', alt: 'نمای اصلی النگو مارشال' },
      { id: 'on-model', alt: 'النگو مارشال روی مچ' },
    ],
    grams: '3.40',
    toleranceGrams: '0.06',
    persianWeight: '۳٫۴۰ گرم (± ۰٫۰۶)',
    karat: 18,
    makingFeeBasisPoints: 1_600,
    promotionalMakingFeeBasisPoints: 1_150,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'سایز', value: 'قطر ۲ (۵۶ میلی‌متر)' },
      { key: 'پهنا', value: '۴ میلی‌متر' },
    ],
    description:
      'النگوی باریک با مقطع نیم‌گرد و پرداخت مات. یکی از ارزان‌ترین راه‌های شروع یک دست النگو، و در حراج این هفته با اجرت کمتر عرضه می‌شود.',
    unitsSold: 105,
    inStock: true,
    installmentEligible: true,
    collections: ['weekly-sale'],
    listedAt: '2026-05-16',
    relatedSlugs: ['woven-single-bangle', 'six-piece-bangle-set'],
  },
  {
    slug: 'six-piece-bangle-set',
    sku: 'ZN-50412',
    title: 'النگو شش‌پوش',
    latinTitle: 'Zarnama Six Bangle Set',
    categorySlug: 'bangles',
    subTypeSlug: 'bangles-stacked',
    media: [
      { id: 'front', alt: 'شش النگو کنار هم' },
      { id: 'on-model', alt: 'دست النگو شش‌پوش روی مچ' },
    ],
    grams: '12.40',
    toleranceGrams: '0.15',
    persianWeight: '۱۲٫۴۰ گرم مجموع شش عدد (± ۰٫۱۵)',
    karat: 18,
    makingFeeBasisPoints: 1_500,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'تعداد', value: 'شش النگو هم‌اندازه' },
      { key: 'سایز', value: 'قطر ۲ (۵۶ میلی‌متر)' },
    ],
    description:
      'یک دست کامل شش‌تایی با طرح یکسان، برای کسانی که می‌خواهند مچ را یکجا ببندند. سنگین‌ترین قلم مجموعه و پرتقاضاترین گزینه در خرید اقساطی.',
    unitsSold: 64,
    inStock: true,
    installmentEligible: true,
    collections: [],
    listedAt: '2026-01-19',
    relatedSlugs: ['woven-single-bangle', 'marshal-single-bangle', 'braided-sport-bracelet'],
  },

  /* ----------------------------------------------------------------- sets -- */
  {
    slug: 'full-jewellery-set',
    sku: 'ZN-60127',
    title: 'سرویس کامل عروس',
    latinTitle: 'Zarnama Bridal Set',
    categorySlug: 'sets',
    subTypeSlug: 'sets-full',
    media: [
      { id: 'front', alt: 'سرویس کامل عروس روی پارچه مخمل' },
      { id: 'detail', alt: 'جزئیات پلاک گردنبند سرویس' },
      { id: 'packaging', alt: 'جعبه سرویس و فاکتور رسمی' },
    ],
    grams: '8.20',
    toleranceGrams: '0.12',
    persianWeight: '۸٫۲۰ گرم مجموع (± ۰٫۱۲)',
    karat: 18,
    makingFeeBasisPoints: 1_800,
    promotionalMakingFeeBasisPoints: 1_100,
    colours: GOLD_COLOURS,
    unavailableSizes: [],
    sized: false,
    extraSpecs: [
      { key: 'اجزا', value: 'گردنبند، جفت گوشواره، دستبند، انگشتر' },
      { key: 'سایز انگشتر', value: 'هنگام تحویل تنظیم می‌شود' },
    ],
    description:
      'سرویس چهارتکه با طرح یکدست، در جعبه مخصوص. سایز انگشتر سرویس در شعبه و هنگام تحویل تنظیم می‌شود، بنابراین سفارش آن نیازی به دانستن سایز ندارد.',
    unitsSold: 47,
    inStock: true,
    installmentEligible: true,
    collections: ['weekly-sale', 'bridal'],
    listedAt: '2026-04-30',
    relatedSlugs: ['rose-gold-heart-half-set', 'paired-wedding-bands'],
  },
  {
    slug: 'rose-gold-heart-half-set',
    sku: 'ZN-60284',
    title: 'نیم‌ست قلب رزگلد',
    latinTitle: 'Zarnama Rose Heart Half Set',
    categorySlug: 'sets',
    subTypeSlug: 'sets-half',
    media: [
      { id: 'front', alt: 'نیم‌ست قلب رزگلد' },
      { id: 'on-model', alt: 'گردنبند نیم‌ست قلب روی گردن' },
    ],
    grams: '5.10',
    toleranceGrams: '0.09',
    persianWeight: '۵٫۱۰ گرم مجموع (± ۰٫۰۹)',
    karat: 18,
    makingFeeBasisPoints: 1_700,
    colours: [
      { colour: 'rose', label: 'رزگلد', available: true },
      { colour: 'yellow', label: 'زرد', available: true },
      { colour: 'white', label: 'سفید', available: false },
    ],
    unavailableSizes: [],
    sized: false,
    extraSpecs: [{ key: 'اجزا', value: 'گردنبند و جفت گوشواره' }],
    description:
      'نیم‌ست دوتکه با پلاک قلب از آلیاژ رزگلد. رایج‌ترین انتخاب برای هدیه سالگرد در این مجموعه.',
    unitsSold: 93,
    inStock: true,
    installmentEligible: true,
    collections: ['bridal'],
    listedAt: '2026-03-08',
    relatedSlugs: ['full-jewellery-set', 'delicate-butterfly-necklace'],
  },
];

/** The catalogue, with every piece's shared specification rows in place. */
export const PRODUCT_FIXTURES: readonly ProductFixture[] = SEEDS.map(
  ({ persianWeight, extraSpecs, ...seed }) => ({
    ...seed,
    specs: [...leadSpecs(seed.karat, persianWeight), ...extraSpecs, ...tailSpecs(seed.sku)],
  }),
);

export { PROFIT_BASIS_POINTS, VAT_BASIS_POINTS, ringSizes };
