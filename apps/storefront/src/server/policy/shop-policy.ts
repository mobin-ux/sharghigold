/**
 * The promises the shop makes on every product page.
 *
 * Delivery terms, the returns policy, the authenticity guarantee, the
 * instalment terms and how long a price is held. All of it is the same for
 * every piece in the catalogue, because the shop is one seller with one set of
 * terms — modelling it per product would mean a returns policy could differ
 * between two rings by accident, which is precisely the sort of thing rule 7
 * warns against making configurable.
 *
 * It lives here, on the server, rather than inside a component, for the other
 * half of that rule: this is commercial and legal copy that changes without a
 * deploy, and when the admin panel exists it is content it will own. Nothing
 * above this file may hold a copy of it.
 *
 * The one thing that is *not* copy is the money. The Tehran courier fee is a
 * rial amount held as a `bigint` and formatted at render, never a string
 * someone typed with the digits already grouped.
 */
import { rials, type Rials } from '@sharghigold/money';

/* -------------------------------------------------------------------------- */
/* Price lock                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * How long a quoted price is honoured, in seconds.
 *
 * Five minutes, which is what the page tells the customer and what the FAQ
 * repeats. It is here rather than in the pricing module because it is a
 * commercial promise, not an arithmetic detail: shortening it is a decision
 * about how much rate movement the shop absorbs.
 */
export const PRICE_LOCK_SECONDS = 300;

/** The instalment terms offered, in months. */
export const INSTALLMENT_TERMS = [12, 24, 36] as const;

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Names a drawing the storefront owns.
 *
 * A key rather than markup, for the same reason category tiles use one: this
 * is content an editor will eventually choose, and an editor who can choose
 * markup can put markup on every customer's page.
 */
export type PolicyIcon =
  | 'shield'
  | 'invoice'
  | 'truck'
  | 'return'
  | 'delivery'
  | 'store'
  | 'courier'
  | 'chat'
  | 'ruler'
  | 'calculator';

/* -------------------------------------------------------------------------- */
/* Assurances                                                                 */
/* -------------------------------------------------------------------------- */

export interface Assurance {
  readonly icon: PolicyIcon;
  readonly title: string;
  readonly note: string;
}

export const ASSURANCES: readonly Assurance[] = [
  {
    icon: 'shield',
    title: 'ضمانت اصالت و عیار',
    note: 'با برچسب اصالت و امکان استعلام',
  },
  {
    icon: 'invoice',
    title: 'فاکتور رسمی',
    note: 'شامل وزن، عیار، اجرت و مالیات',
  },
  {
    icon: 'truck',
    title: 'ارسال بیمه‌شده رایگان',
    note: 'تحویل ۲ تا ۴ روز کاری در سراسر ایران',
  },
  {
    icon: 'return',
    title: 'بازگشت ۷ روزه',
    note: 'بدون قید و شرط، با کسر اجرت ساخت',
  },
];

/* -------------------------------------------------------------------------- */
/* Delivery                                                                   */
/* -------------------------------------------------------------------------- */

export interface ShippingOption {
  readonly icon: PolicyIcon;
  readonly title: string;
  readonly description: string;
  /** Null when the option is free. A fee is money, so it is rials. */
  readonly costRials: Rials | null;
}

export const SHIPPING_OPTIONS: readonly ShippingOption[] = [
  {
    icon: 'delivery',
    title: 'ارسال بیمه‌شده رایگان',
    description:
      'تهران ۲۴ ساعت کاری، سایر شهرها ۲ تا ۴ روز کاری. بسته با بیمه کامل ارزش کالا ارسال می‌شود.',
    costRials: null,
  },
  {
    icon: 'store',
    title: 'تحویل حضوری در فروشگاه',
    description:
      'دریافت از شعبه بازار بزرگ تهران، همان روز پس از تأیید سفارش. امکان بازبینی کالا پیش از تحویل.',
    costRials: null,
  },
  {
    icon: 'courier',
    title: 'پیک اختصاصی تهران',
    description: 'تحویل در بازه زمانی انتخابی شما، با تأیید هویت گیرنده در محل.',
    costRials: rials(2_500_000n),
  },
];

/* -------------------------------------------------------------------------- */
/* Returns and warranty                                                       */
/* -------------------------------------------------------------------------- */

export interface ReturnRule {
  /** True for what the policy allows, false for what it excludes. */
  readonly allowed: boolean;
  readonly text: string;
}

export const RETURN_RULES: readonly ReturnRule[] = [
  {
    allowed: true,
    text: 'بازگشت بدون قید و شرط تا ۷ روز پس از تحویل، در صورت نداشتن آثار استفاده.',
  },
  {
    allowed: true,
    text: 'مرجوعی رایگان است و هزینه ارسال بازگشت بر عهده زرنما است.',
  },
  {
    allowed: true,
    text: 'مبلغ بازگشت حداکثر ۴۸ ساعت کاری پس از تأیید کارشناس به حساب یا کیف پول شما واریز می‌شود.',
  },
  {
    allowed: false,
    text: 'کالای سفارشی‌سازی‌شده (حکاکی، تغییر سایز بیش از دو شماره) قابل مرجوع کردن نیست.',
  },
  {
    allowed: false,
    text: 'مرجوعی بدون فاکتور رسمی و برچسب اصالت پذیرفته نمی‌شود.',
  },
];

export const RETURN_VALUATION_NOTE =
  'مبنای محاسبه بازگشت وجه، قیمت لحظه‌ای طلا در زمان تأیید مرجوعی است و اجرت ساخت مطابق فاکتور کسر می‌شود.';

export const WARRANTY_POINTS: readonly string[] = [
  'ضمانت اصالت و عیار با برچسب هولوگرام و امکان استعلام آنلاین کد کالا.',
  'فاکتور رسمی شامل وزن، عیار، اجرت ساخت، سود فروشنده و مالیات ارزش افزوده.',
  'بازخرید کالا با نرخ لحظه‌ای طلا در هر زمان، بدون محدودیت زمانی.',
  'خدمات رایگان کارگاه: پرداخت مجدد، آبکاری رودیوم و تغییر سایز تا دو شماره.',
];

/* -------------------------------------------------------------------------- */
/* Frequently asked                                                           */
/* -------------------------------------------------------------------------- */

export interface PolicyQuestion {
  readonly question: string;
  readonly answer: string;
}

export const PRODUCT_FAQS: readonly PolicyQuestion[] = [
  {
    question: 'آیا فاکتور رسمی همراه کالا ارسال می‌شود؟',
    answer:
      'بله. همه سفارش‌ها با فاکتور رسمی شامل وزن، عیار، اجرت و مالیات ارسال می‌شوند و در صورت فروش مجدد قابل استناد است.',
  },
  {
    question: 'اگر سایز انگشتر مناسب نبود چه کنم؟',
    answer:
      'تا ۷ روز پس از تحویل می‌توانید درخواست تعویض سایز ثبت کنید. تغییر سایز رکاب ساده رایگان و برای رکاب‌های نگین‌دار با هزینه اجرت انجام می‌شود.',
  },
  {
    question: 'قیمت طلا چه زمانی به‌روزرسانی می‌شود؟',
    answer:
      'نرخ هر ۲ دقیقه از بازار دریافت می‌شود. با افزودن کالا به سبد، قیمت به مدت ۵ دقیقه برای شما قفل می‌ماند.',
  },
  {
    question: 'خرید اقساطی چه شرایطی دارد؟',
    answer:
      'احراز هویت آنلاین با کد ملی و شماره موبایل کافی است؛ بدون چک و ضامن و بدون پیش‌پرداخت، تا ۳۶ ماه.',
  },
];

/* -------------------------------------------------------------------------- */
/* The seller                                                                 */
/* -------------------------------------------------------------------------- */

export const SELLER = {
  name: 'گالری زرنما',
  /** The single Persian letter drawn in the seller badge. */
  initial: 'ز',
  note: 'عملکرد عالی · پروانه کسب اتحادیه طلا و جواهر',
} as const;
