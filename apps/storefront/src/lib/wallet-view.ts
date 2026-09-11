import type { PaymentMethod, PaymentStatus } from '@sharghigold/contracts';
import { RIALS_PER_TOMAN, toPersianDigits } from '@sharghigold/money';

import { toman } from '@/lib/product-view';

export { persianCount, toman, weightLabel } from '@/lib/product-view';

/* -------------------------------------------------------------------------- */
/* Amounts in words                                                           */
/* -------------------------------------------------------------------------- */

const MILLION_TOMANS = 1_000_000n;
const THOUSAND_TOMANS = 1_000n;

function fa(value: bigint): string {
  return toPersianDigits(String(value));
}

/**
 * «۵ میلیون تومان», «۱ میلیون و ۵۰۰ هزار تومان».
 *
 * The design writes the quick-pick chips and the helper line under the field
 * this way, and it is worth keeping: a row of grouped digits is easy to
 * misread by a factor of ten, and this phrasing is not.
 *
 * Returns an empty string below a thousand tomans, where the words are longer
 * than the figure and say less.
 */
export function tomanWords(amountRials: string): string {
  const tomans = BigInt(amountRials) / RIALS_PER_TOMAN;
  const millions = tomans / MILLION_TOMANS;
  const thousands = (tomans % MILLION_TOMANS) / THOUSAND_TOMANS;

  if (millions > 0n && tomans % MILLION_TOMANS === 0n) return `${fa(millions)} میلیون تومان`;
  if (millions > 0n) return `${fa(millions)} میلیون و ${fa(thousands)} هزار تومان`;
  if (thousands > 0n && tomans % THOUSAND_TOMANS === 0n) return `${fa(thousands)} هزار تومان`;

  return '';
}

/** The figure a text field shows: grouped Persian digits, in tomans. */
export function tomanField(amountRials: string): string {
  return toman(amountRials);
}

/* -------------------------------------------------------------------------- */
/* How the money is being sent                                                */
/* -------------------------------------------------------------------------- */

interface MethodCopy {
  readonly label: string;
  readonly note: string;
  /** False while there is nothing behind it. Enforced on the server too. */
  readonly available: boolean;
}

export const PAYMENT_METHODS: Record<PaymentMethod, MethodCopy> = {
  gateway: {
    label: 'درگاه پرداخت اینترنتی',
    note: 'پرداخت با کارت‌های عضو شتاب',
    available: true,
  },
  'card-to-card': {
    label: 'کارت به کارت',
    note: 'به‌زودی فعال می‌شود',
    available: false,
  },
};

export const METHOD_ORDER: readonly PaymentMethod[] = ['gateway', 'card-to-card'];

/* -------------------------------------------------------------------------- */
/* How it ended                                                               */
/* -------------------------------------------------------------------------- */

export type ResultTone = 'good' | 'bad' | 'idle' | 'pending';

interface ResultCopy {
  readonly title: string;
  readonly note: string;
  readonly status: string;
  readonly tone: ResultTone;
  readonly variant: 'success' | 'danger' | 'info' | 'warning';
  /** Whether a second attempt is worth offering. */
  readonly retry: boolean;
}

export const RESULT_COPY: Record<PaymentStatus, ResultCopy> = {
  succeeded: {
    title: 'پرداخت با موفقیت انجام شد',
    note: 'مبلغ به کیف پول شما اضافه شد و هم‌اکنون قابل استفاده است.',
    status: 'موفق',
    tone: 'good',
    variant: 'success',
    retry: false,
  },
  failed: {
    title: 'پرداخت ناموفق بود',
    note: 'مبلغی از حساب شما کسر نشده است. اگر کسر شده، حداکثر تا ۷۲ ساعت به حسابتان بازمی‌گردد.',
    status: 'ناموفق',
    tone: 'bad',
    variant: 'danger',
    retry: true,
  },
  canceled: {
    title: 'پرداخت لغو شد',
    note: 'شما پرداخت را در درگاه بانکی لغو کردید. هیچ مبلغی کسر نشده است.',
    status: 'لغوشده',
    tone: 'idle',
    variant: 'info',
    retry: true,
  },
  pending: {
    title: 'پرداخت در حال بررسی است',
    note: 'نتیجه تراکنش هنوز از بانک دریافت نشده. تا دقایقی دیگر وضعیت مشخص می‌شود و موجودی به‌روز خواهد شد.',
    status: 'در حال بررسی',
    tone: 'pending',
    variant: 'warning',
    retry: false,
  },
};

/* -------------------------------------------------------------------------- */
/* The receipt                                                                */
/* -------------------------------------------------------------------------- */

/** The tracking number, in Persian numerals, leading zeros kept. */
export function referenceLabel(reference: string): string {
  return toPersianDigits(reference);
}

/**
 * «۱۴۰۵/۰۵/۲۱ — ۱۴:۳۲», the stamp a receipt carries.
 *
 * Numeric rather than the long month the rest of the account uses, because a
 * receipt is quoted back to support and a slashed date is what a support
 * screen shows. Tehran, for the reason every other date here is.
 */
const STAMP_DATE = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Tehran',
});

const STAMP_TIME = new Intl.DateTimeFormat('fa-IR-u-nu-arabext', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tehran',
});

export function receiptStamp(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';

  return `${STAMP_DATE.format(at)} — ${STAMP_TIME.format(at)}`;
}

/* -------------------------------------------------------------------------- */
/* What went wrong on the way in                                              */
/* -------------------------------------------------------------------------- */

/**
 * The refusals the form can show, resolved from a key rather than carried as a
 * sentence. Two of them quote a limit, so they are written where the limit is
 * imported and cannot drift from it.
 */
export const AMOUNT_PROBLEM = {
  empty: 'مبلغ را وارد کنید.',
  shape: 'مبلغ را به عدد وارد کنید.',
  'too-small': 'حداقل مبلغ افزایش موجودی ۵۰٬۰۰۰ تومان است.',
  'too-large': 'حداکثر مبلغ در هر تراکنش ۵۰۰٬۰۰۰٬۰۰۰ تومان است.',
  'method-unavailable': 'این روش پرداخت هنوز فعال نیست.',
} as const;

export const AMOUNT_RANGE_HINT = 'از ۵۰٬۰۰۰ تا ۵۰۰٬۰۰۰٬۰۰۰ تومان';

export const TOP_UP_STEPS: readonly string[] = ['مبلغ', 'پرداخت', 'نتیجه'];
