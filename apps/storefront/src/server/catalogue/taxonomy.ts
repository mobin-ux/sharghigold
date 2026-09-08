/**
 * SEED CONTENT for the category browser.
 *
 * This is the shape the catalogue service will return, written out as a
 * literal so the storefront can be built and reviewed before that service
 * exists. It is not a second source of truth: `navigation.ts` parses it
 * through the shared contract, and the day `GET /api/v1/categories` is real,
 * that gateway swaps its source and this file is deleted.
 *
 * It lives under `server/` and is never imported by a component. Components
 * receive categories as props (rule 7) — a merchandiser adds a facet tile by
 * editing a category, not by opening a `.tsx` file.
 *
 * Two conventions worth knowing before editing:
 *
 *   * `query` values are listing filters and are re-parsed server-side by the
 *     listing page. They are strings here because they are URL parameters, not
 *     because anything downstream trusts them.
 *   * Prices are whole **rials** and weights whole **milligrams**, matching
 *     `@sharghigold/money` and the database. «تا ۱۰ میلیون» is ten million
 *     *toman*, which is 100,000,000 rials — the labels are in the unit
 *     customers speak, the filters in the unit the system computes in.
 */
import type { CategoryNavigationEntry, FacetGroup, FacetTile } from '@sharghigold/contracts';

/** One toman is ten rials. Written out so the conversions below read plainly. */
const RIALS_PER_TOMAN = 10n;
const MILLION = 1_000_000n;

const toman = (millions: bigint): string => String(millions * MILLION * RIALS_PER_TOMAN);
const grams = (value: number): string => String(Math.round(value * 1000));

/**
 * The «همه کالاها» tile that closes every group.
 *
 * It clears the group's filter rather than adding one, so it is the plain
 * category with no query — which is also what the canvas links it to.
 */
const allProducts = (slug: string): FacetTile => ({
  label: 'همه کالاها',
  slug,
  query: {},
  icon: null,
});

/* -------------------------------------------------------------------------- */
/* Groups shared by every category                                            */
/* -------------------------------------------------------------------------- */

const budgetGroup = (slug: string): FacetGroup => ({
  kind: 'budget',
  title: 'خرید بر اساس بودجه',
  tiles: [
    { label: 'تا ۱۰ میلیون', slug, query: { maxPrice: toman(10n) }, icon: 'budget.1' },
    { label: 'تا ۲۰ میلیون', slug, query: { maxPrice: toman(20n) }, icon: 'budget.2' },
    { label: 'تا ۵۰ میلیون', slug, query: { maxPrice: toman(50n) }, icon: 'budget.3' },
    allProducts(slug),
  ],
});

/**
 * The usual three weight bands: under `lower`, between the two, over `upper`.
 *
 * Thresholds come as `[grams, Persian numeral]` pairs. The numeral is written
 * out rather than derived because these are labels a merchandiser will
 * eventually edit, and «۵» is not always the right rendering of 5 — a band of
 * «۱٫۵ گرم» would need a decimal separator that no digit-mapping produces.
 */
type WeightThreshold = readonly [grams: number, label: string];

const weightGroup = (
  slug: string,
  [lowerG, lowerLabel]: WeightThreshold,
  [upperG, upperLabel]: WeightThreshold,
): FacetGroup => ({
  kind: 'weight',
  title: 'خرید بر اساس وزن',
  tiles: [
    {
      label: `زیر ${lowerLabel} گرم`,
      slug,
      query: { maxWeightMg: grams(lowerG) },
      icon: 'weight.scale-1',
    },
    {
      label: `${lowerLabel} تا ${upperLabel} گرم`,
      slug,
      query: { minWeightMg: grams(lowerG), maxWeightMg: grams(upperG) },
      icon: 'weight.scale-2',
    },
    {
      label: `بالای ${upperLabel} گرم`,
      slug,
      query: { minWeightMg: grams(upperG) },
      icon: 'weight.scale-3',
    },
    allProducts(slug),
  ],
});

/** The three thresholds the catalogue actually uses. */
const G2: WeightThreshold = [2, '۲'];
const G5: WeightThreshold = [5, '۵'];
const G10: WeightThreshold = [10, '۱۰'];
const G15: WeightThreshold = [15, '۱۵'];

const offersGroup = (slug: string): FacetGroup => ({
  kind: 'offers',
  title: 'تخفیف‌دارهای امروز',
  tiles: [
    {
      label: 'تا ۲۰٪ تخفیف اجرت',
      slug,
      query: { discounted: '1' },
      icon: 'offers.making-fee',
    },
    { label: 'حراج هفته', slug, query: { collection: 'weekly-sale' }, icon: 'offers.weekly' },
    { label: 'نو رسیده‌ها', slug, query: { sort: 'newest' }, icon: 'offers.new' },
    allProducts(slug),
  ],
});

const installmentGroup = (slug: string): FacetGroup => ({
  kind: 'installment',
  title: 'قابل خرید اقساطی',
  tiles: [
    {
      label: 'بدون پیش‌پرداخت',
      slug,
      query: { installment: 'no-deposit' },
      icon: 'installment.no-deposit',
    },
    { label: '۱۲ ماهه', slug, query: { installmentMonths: '12' }, icon: 'installment.12' },
    { label: '۳۶ ماهه', slug, query: { installmentMonths: '36' }, icon: 'installment.36' },
    allProducts(slug),
  ],
});

/** The sub-types of a category. Each tile is a real child category. */
const modelsGroup = (
  title: string,
  slug: string,
  models: readonly (readonly [label: string, childSlug: string, icon: string])[],
): FacetGroup => ({
  kind: 'models',
  title: `مدل ${title}`,
  tiles: [
    ...models.map(([label, childSlug, icon]) => ({ label, slug: childSlug, query: {}, icon })),
    allProducts(slug),
  ],
});

/* -------------------------------------------------------------------------- */
/* The categories                                                             */
/* -------------------------------------------------------------------------- */

export const CATEGORY_TAXONOMY: readonly CategoryNavigationEntry[] = [
  {
    slug: 'earrings',
    title: 'گوشواره',
    icon: 'earring',
    productCount: 248,
    installmentEligible: true,
    groups: [
      modelsGroup('گوشواره', 'earrings', [
        ['آویز', 'earrings-drop', 'earring.drop'],
        ['حلقه‌ای', 'earrings-hoop', 'earring.hoop'],
        ['میخی', 'earrings-stud', 'earring.stud'],
        ['بخیه‌ای', 'earrings-climber', 'earring.climber'],
        ['مجلسی', 'earrings-occasion', 'earring.occasion'],
      ]),
      budgetGroup('earrings'),
      weightGroup('earrings', G2, G5),
      offersGroup('earrings'),
      installmentGroup('earrings'),
    ],
  },
  {
    slug: 'necklaces',
    title: 'گردنبند',
    icon: 'necklace',
    productCount: 316,
    installmentEligible: true,
    groups: [
      modelsGroup('گردنبند', 'necklaces', [
        ['پلاک اسم', 'necklaces-name-plate', 'necklace.name-plate'],
        ['زنجیر ونیزی', 'necklaces-venetian', 'necklace.venetian'],
        ['قلب و پروانه', 'necklaces-heart-butterfly', 'necklace.heart-butterfly'],
        ['چوکر', 'necklaces-choker', 'necklace.choker'],
        ['مجلسی', 'necklaces-occasion', 'necklace.occasion'],
      ]),
      budgetGroup('necklaces'),
      weightGroup('necklaces', G2, G5),
      offersGroup('necklaces'),
      installmentGroup('necklaces'),
    ],
  },
  {
    slug: 'rings',
    title: 'انگشتر',
    icon: 'ring',
    productCount: 194,
    installmentEligible: true,
    groups: [
      modelsGroup('انگشتر', 'rings', [
        ['تک‌نگین', 'rings-solitaire', 'ring.solitaire'],
        ['حلقه ازدواج', 'rings-wedding', 'ring.wedding'],
        ['رینگ ظریف', 'rings-slim', 'ring.slim'],
        ['انگشتر مردانه', 'rings-mens', 'ring.mens'],
        ['سنگ‌دار', 'rings-gemstone', 'ring.gemstone'],
      ]),
      budgetGroup('rings'),
      weightGroup('rings', G2, G5),
      offersGroup('rings'),
      installmentGroup('rings'),
    ],
  },
  {
    slug: 'bangles',
    title: 'النگو',
    icon: 'bangle',
    productCount: 127,
    installmentEligible: true,
    groups: [
      modelsGroup('النگو', 'bangles', [
        ['تک‌پوش', 'bangles-single', 'bangle.single'],
        ['النگویی', 'bangles-stacked', 'bangle.stacked'],
        ['حصیری', 'bangles-woven', 'bangle.woven'],
        ['کارتیه', 'bangles-cartier', 'bangle.cartier'],
        ['مجلسی', 'bangles-occasion', 'bangle.occasion'],
      ]),
      budgetGroup('bangles'),
      weightGroup('bangles', G5, G10),
      offersGroup('bangles'),
      installmentGroup('bangles'),
    ],
  },
  {
    slug: 'bracelets',
    title: 'دستبند',
    icon: 'bracelet',
    productCount: 163,
    installmentEligible: true,
    groups: [
      modelsGroup('دستبند', 'bracelets', [
        ['زنجیری', 'bracelets-chain', 'bracelet.chain'],
        ['بافت', 'bracelets-braided', 'bracelet.braided'],
        ['چرم و طلا', 'bracelets-leather', 'bracelet.leather'],
        ['اسپرت', 'bracelets-sport', 'bracelet.sport'],
        ['دستبند پلاک', 'bracelets-plate', 'bracelet.plate'],
      ]),
      budgetGroup('bracelets'),
      weightGroup('bracelets', G2, G5),
      offersGroup('bracelets'),
      installmentGroup('bracelets'),
    ],
  },
  {
    slug: 'sets',
    title: 'سرویس و نیم‌ست',
    icon: 'set',
    productCount: 89,
    installmentEligible: true,
    groups: [
      modelsGroup('سرویس و نیم‌ست', 'sets', [
        ['نیم‌ست', 'sets-half', 'set.half'],
        ['سرویس کامل', 'sets-full', 'set.full'],
        ['سرویس عروس', 'sets-bridal', 'set.bridal'],
        ['ست هدیه', 'sets-gift', 'set.gift'],
        ['ست مادر و دختر', 'sets-mother-daughter', 'set.mother-daughter'],
      ]),
      budgetGroup('sets'),
      weightGroup('sets', G5, G15),
      {
        kind: 'collection',
        title: 'مجموعه عروس',
        tiles: [
          { label: 'سرویس عروس', slug: 'sets-bridal', query: {}, icon: 'set.bridal' },
          { label: 'نیم‌ست عقد', slug: 'sets-engagement', query: {}, icon: 'set.engagement-half' },
          { label: 'هدیه ساقدوش', slug: 'sets-bridesmaid', query: {}, icon: 'set.bridesmaid' },
          allProducts('sets'),
        ],
      },
      offersGroup('sets'),
      installmentGroup('sets'),
    ],
  },
  {
    slug: 'coins',
    title: 'سکه و شمش',
    icon: 'coin',
    productCount: 42,
    // Bullion is sold against the spot price with no making fee, so there is
    // no margin to carry an instalment plan. The canvas hides the banner here
    // for the same reason.
    installmentEligible: false,
    groups: [
      modelsGroup('سکه و شمش', 'coins', [
        ['سکه امامی', 'coins-emami', 'coin.emami'],
        ['نیم‌سکه', 'coins-half', 'coin.half'],
        ['ربع‌سکه', 'coins-quarter', 'coin.quarter'],
        ['سکه گرمی', 'coins-gram', 'coin.gram'],
        ['شمش طلا', 'coins-bullion', 'coin.bullion'],
      ]),
      budgetGroup('coins'),
      {
        kind: 'weight',
        title: 'خرید بر اساس وزن',
        tiles: [
          {
            label: 'ربع‌سکه (۲٫۰ گرم)',
            slug: 'coins-quarter',
            query: {},
            icon: 'weight.coin-quarter',
          },
          { label: 'نیم‌سکه (۴٫۰ گرم)', slug: 'coins-half', query: {}, icon: 'weight.coin-half' },
          { label: 'سکه کامل (۸٫۱ گرم)', slug: 'coins-emami', query: {}, icon: 'weight.coin-full' },
          {
            label: 'شمش ۱ و ۵ گرمی',
            slug: 'coins-bullion',
            query: { maxWeightMg: grams(5) },
            icon: 'weight.ingot-small',
          },
          {
            label: 'شمش ۱۰ و ۵۰ گرمی',
            slug: 'coins-bullion',
            query: { minWeightMg: grams(10) },
            icon: 'weight.ingot-large',
          },
          allProducts('coins'),
        ],
      },
      {
        kind: 'collection',
        title: 'طلای آب‌شده و شمش',
        tiles: [
          {
            label: 'شمش ۱ گرمی',
            slug: 'coins-bullion',
            query: { weightMg: grams(1) },
            icon: 'coin.ingot-1g',
          },
          {
            label: 'شمش ۵ گرمی',
            slug: 'coins-bullion',
            query: { weightMg: grams(5) },
            icon: 'coin.ingot-5g',
          },
          { label: 'آب‌شده', slug: 'coins-melted', query: {}, icon: 'coin.melted' },
          allProducts('coins'),
        ],
      },
      offersGroup('coins'),
      installmentGroup('coins'),
    ],
  },
  {
    slug: 'gifts',
    title: 'هدیه و مناسبت‌ها',
    icon: 'gift',
    productCount: 205,
    installmentEligible: true,
    groups: [
      {
        kind: 'models',
        title: 'مدل هدیه و مناسبت‌ها',
        tiles: [
          { label: 'هدیه تولد', slug: 'gifts-birthday', query: {}, icon: 'gift.birthday' },
          {
            label: 'سالگرد ازدواج',
            slug: 'gifts-anniversary',
            query: {},
            icon: 'gift.anniversary',
          },
          { label: 'هدیه نوزاد', slug: 'gifts-baby', query: {}, icon: 'gift.baby' },
          { label: 'کادو برای مادر', slug: 'gifts-mother', query: {}, icon: 'gift.mother' },
          // A budget band rather than an occasion, which is why it filters the
          // parent category instead of pointing at a child of its own.
          {
            label: 'کادو زیر ۱۰ میلیون',
            slug: 'gifts',
            query: { maxPrice: toman(10n) },
            icon: 'gift.budget',
          },
          allProducts('gifts'),
        ],
      },
      budgetGroup('gifts'),
      weightGroup('gifts', G2, G5),
      offersGroup('gifts'),
      installmentGroup('gifts'),
    ],
  },
];
