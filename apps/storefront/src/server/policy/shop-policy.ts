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

import { INSTALLMENT } from '@/config/commerce-terms';

/* -------------------------------------------------------------------------- */
/* Terms the admin panel will own                                             */
/* -------------------------------------------------------------------------- */

/**
 * Re-exported from `config/commerce-terms.ts`.
 *
 * The numbers live there so a client component can read one of them without
 * pulling this file's Persian copy into the browser bundle. They are exported
 * from here as well so that nothing calling itself «the shop's policy» has to
 * know which of the two files a given term sits in.
 */
export {
  CATALOGUE_RATES,
  INSTALLMENT,
  INSTALLMENT_DEPOSIT_PERCENT,
  INSTALLMENT_HINT,
  INSTALLMENT_MAX_MONTHS,
  PRICE_LOCK_SECONDS,
} from '@/config/commerce-terms';

export const INSTALLMENT_TERMS: readonly number[] = INSTALLMENT.terms;

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

/**
 * پیک اختصاصی تهران — the one delivery the shop charges for.
 *
 * Named rather than written twice: the product page quotes it and checkout
 * charges it, and two literals is two figures that can drift apart.
 */
export const COURIER_FEE_RIALS: Rials = rials(2_500_000n);

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
    costRials: COURIER_FEE_RIALS,
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
      'احراز هویت آنلاین با کد ملی و شماره موبایل کافی است؛ بدون چک و ضامن، با پیش‌پرداخت ۴۰٪ و بازپرداخت ۶ تا ۱۸ ماهه. مبلغ اقساط شامل کارمزد ۲٪ ماهانه روی مانده است.',
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
