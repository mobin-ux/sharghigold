/**
 * The words on `/installment`.
 *
 * Content an editor will own in the admin panel, kept apart from the page for
 * that reason. Every figure in it is read from `config/commerce-terms.ts` or
 * the shop policy rather than typed, so the copy cannot promise a term the
 * calculator and checkout do not offer.
 *
 * Only what the shop actually does is said here. The canvas this page is drawn
 * from also advertises instant credit approval, a 36-month plan, a monthly
 * application quota, lending partners, approval statistics and named reviews;
 * none of those exists, so none of them is written down. See ADR 0012.
 */
import { formatToman, rialsToToman } from '@sharghigold/money';

import { SUPPORT } from '@/config/brand';
import {
  CATALOGUE_RATES,
  INSTALLMENT,
  INSTALLMENT_DEPOSIT_PERCENT,
  INSTALLMENT_MAX_MONTHS,
} from '@/config/commerce-terms';
import { persianCount } from '@/lib/product-view';

import { FREE_SHIPPING_ABOVE_RIALS } from '../policy/checkout-policy';
import { COURIER_FEE_RIALS, type PolicyIcon, type PolicyQuestion } from '../policy/shop-policy';

const DEPOSIT = `${persianCount(INSTALLMENT_DEPOSIT_PERCENT)}٪`;
const MONTHLY_RATE = `${persianCount(INSTALLMENT.monthlySurchargeBasisPoints / 100)}٪`;
const TERMS = listLabel(
  INSTALLMENT.terms.map((months) => persianCount(months)),
  'یا',
);

export const INSTALLMENT_HERO = {
  badge: 'قیمت طلا قفل می‌شود',
  /** Two lines, as the canvas breaks it. */
  title: ['طلا را امروز تحویل بگیرید،', 'در آرامش قسط بدهید'],
  lede: `تا ${persianCount(INSTALLMENT_MAX_MONTHS)} ماه اقساط، بدون چک و ضامن. فاکتور رسمی و ضمانت اصالت برای همان طلایی که می‌خرید.`,
  cta: 'قسط من چقدر می‌شود؟',
} as const;

export interface InstallmentAssurance {
  readonly icon: PolicyIcon | 'star';
  /** Drawn on two lines. */
  readonly lines: readonly [string, string];
}

export const INSTALLMENT_ASSURANCES: readonly InstallmentAssurance[] = [
  { icon: 'shield', lines: ['بدون چک', 'و ضامن'] },
  { icon: 'invoice', lines: ['فاکتور رسمی', 'و مالیاتی'] },
  { icon: 'truck', lines: ['ارسال بیمه‌شده', 'به سراسر ایران'] },
  { icon: 'star', lines: ['نیم‌قرن', 'سابقه'] },
];

export const CALCULATOR_COPY = {
  title: 'محاسبه‌گر اقساط',
  unitNote: 'مبالغ به تومان',
  lede: 'مبلغ خرید و تعداد اقساط را انتخاب کنید تا قسط ماهانه دقیق، کارمزد و مبلغ کل پرداختی را ببینید.',
  helper: 'مبلغ کل خریدی که می‌خواهید قسطی بپردازید',
  depositNote: `پیش‌پرداخت همه طرح‌ها ${DEPOSIT} است و هنگام ثبت سفارش پرداخت می‌شود.`,
  cta: 'انتخاب طلای اقساطی',
  ctaNote: 'خرید اقساطی را در مرحله پرداخت سبد خرید انتخاب می‌کنید.',
} as const;

export interface InstallmentStep {
  readonly title: string;
  readonly body: string;
}

export const INSTALLMENT_STEPS: readonly InstallmentStep[] = [
  {
    title: 'انتخاب طلا و محاسبه قسط',
    body: 'مبلغ و تعداد اقساط را در محاسبه‌گر مشخص کنید.',
  },
  {
    title: 'انتخاب «خرید اقساطی» هنگام پرداخت',
    body: `کالا را به سبد بیفزایید و در مرحله پرداخت، خرید اقساطی و ${TERMS} قسط را انتخاب کنید.`,
  },
  {
    title: 'پرداخت پیش‌پرداخت و احراز هویت',
    body: `${DEPOSIT} مبلغ همان لحظه پرداخت و قیمت قفل می‌شود؛ سپس هویت و اعتبار شما بررسی می‌شود.`,
  },
  {
    title: 'تحویل طلا و پرداخت اقساط',
    body: 'ارسال بیمه‌شده یا تحویل حضوری؛ اقساط از کیف پول یا درگاه بانکی.',
  },
];

export interface EligibilityRow {
  readonly text: string;
  /** A note rather than a requirement: drawn with an «i» and muted. */
  readonly note?: true;
}

/** What identity verification asks for — the fields of `/account/identity`. */
export const INSTALLMENT_ELIGIBILITY: readonly EligibilityRow[] = [
  { text: 'حساب کاربری با شماره موبایل به‌نام خودتان' },
  { text: 'کد ملی و تاریخ تولد برای احراز هویت' },
  { text: 'شماره شبای بانکی به‌نام خودتان' },
  { text: 'تصویر سلفی برای تأیید چهره' },
  { text: 'احراز هویت و تأیید اعتبار پس از پرداخت پیش‌پرداخت انجام می‌شود.', note: true },
];

export interface CostRow {
  readonly label: string;
  readonly value: string;
  /** Free or not required: drawn in the success colour. */
  readonly good?: true;
}

export const INSTALLMENT_COSTS: readonly CostRow[] = [
  { label: 'پیش‌پرداخت', value: `${DEPOSIT} مبلغ سفارش` },
  { label: 'کارمزد اقساط', value: `${MONTHLY_RATE} ماهانه روی مانده` },
  {
    label: 'مالیات بر ارزش افزوده',
    value: `${persianCount(CATALOGUE_RATES.vatBasisPoints / 100)}٪ اجرت و سود`,
  },
  {
    label: 'ارسال بیمه‌شده سفارش',
    value: `رایگان بالای ${persianCount(Number(rialsToToman(FREE_SHIPPING_ABOVE_RIALS) / 1_000_000n))} میلیون تومان`,
    good: true,
  },
  { label: 'چک و ضامن', value: 'لازم نیست', good: true },
];

export const RATE_COPY = {
  title: 'قیمت طلای ۱۸ عیار',
  unit: 'تومان / گرم',
  body: 'قیمت طلا در لحظه ثبت سفارش قفل می‌شود؛ نوسان بعدی بازار روی اقساط شما اثری ندارد.',
  link: 'قیمت روز و نمودار طلا',
} as const;

/**
 * The questions, with the categories that can be bought on instalments.
 *
 * A function because that list is the taxonomy's, not the copy's: a category
 * switched off for instalments leaves the answer without an edit.
 */
export function installmentFaqs(eligibleCategories: readonly string[]): readonly PolicyQuestion[] {
  return [
    {
      question: 'آیا برای خرید اقساطی چک یا ضامن لازم است؟',
      answer:
        'خیر. احراز هویت آنلاین با کد ملی و شماره موبایل کافی است و پس از آن اعتبار شما بررسی می‌شود.',
    },
    {
      question: 'اگر قیمت طلا تغییر کند، اقساط من هم تغییر می‌کند؟',
      answer: 'نه. قیمت در لحظه ثبت سفارش قفل می‌شود و مبلغ اقساط تا پایان دوره ثابت می‌ماند.',
    },
    {
      question: 'مبلغ هر قسط چطور محاسبه می‌شود؟',
      answer: `${DEPOSIT} مبلغ هنگام سفارش پرداخت می‌شود. به مانده، ${MONTHLY_RATE} برای هر ماه از دوره اضافه و حاصل به‌طور مساوی میان اقساط تقسیم می‌شود؛ مبلغ هر قسط به تومان بالا گرد می‌شود.`,
    },
    {
      question: 'طلا را چه زمانی تحویل می‌گیرم؟',
      answer: `پس از پرداخت پیش‌پرداخت. ارسال بیمه‌شده در تهران ۲۴ ساعت کاری و در سایر شهرها ۲ تا ۴ روز کاری طول می‌کشد؛ تحویل حضوری در فروشگاه و پیک اختصاصی تهران (${formatToman(COURIER_FEE_RIALS)}) هم امکان دارد.`,
    },
    {
      question: 'چه کالاهایی را می‌توان قسطی خرید؟',
      answer:
        eligibleCategories.length === 0
          ? 'در حال حاضر کالای اقساطی موجود نیست.'
          : `${listLabel(eligibleCategories, 'و')}. کالاهای قابل خرید اقساطی در فهرست محصولات با برچسب اقساط مشخص شده‌اند.`,
    },
    {
      question: 'اقساط را چطور پرداخت کنم؟',
      answer: `اقساط ماهانه از کیف پول زرنما یا درگاه بانکی پرداخت می‌شود. برای هر پرسش دیگر با پشتیبانی به شماره ${SUPPORT.telephoneLabel} تماس بگیرید.`,
    },
  ];
}

export const CALLBACK_COPY = {
  title: 'مشاوره تلفنی رایگان',
  body: 'شماره‌تان را بگذارید؛ کارشناس ما در ساعات کاری با شما تماس می‌گیرد و به پرسش‌هایتان درباره خرید اقساطی پاسخ می‌دهد.',
  submit: 'درخواست تماس',
} as const;

export const TRUST_BADGES: readonly {
  readonly icon: 'shield' | 'lock' | 'invoice';
  readonly label: string;
}[] = [
  { icon: 'shield', label: 'پروانه کسب اتحادیه طلا و جواهر' },
  { icon: 'lock', label: 'ضمانت اصالت و عیار' },
  { icon: 'invoice', label: 'فاکتور رسمی' },
];

export const INSTALLMENT_FOOTNOTE =
  'خرید اقساطی پس از پرداخت پیش‌پرداخت، مشروط به احراز هویت و تأیید اعتبار است. مبلغ دقیق هر قسط پیش از ثبت نهایی سفارش و بر پایه قیمت لحظه‌ای طلا نمایش داده می‌شود.';

/** «الف، ب و ج». */
function listLabel(items: readonly string[], conjunction: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join('، ')} ${conjunction} ${items.at(-1) ?? ''}`;
}
