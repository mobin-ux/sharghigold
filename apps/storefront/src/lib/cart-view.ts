/**
 * Turning a basket, a bill and an order into the words a screen shows.
 *
 * The same division of labour as `product-view`: the server sends keys and
 * whole rials, and locale is applied here, once. Nothing in this file adds,
 * subtracts or scales an amount — the arithmetic happened where the money is,
 * and a formatter that does sums is a formatter that can disagree with the
 * total it is printing.
 */
import type {
  BillLine,
  BillLineKind,
  CheckoutPayment,
  DeliveryMode,
  OrderPaymentState,
  PlacedOrder,
} from '@sharghigold/contracts';
import { formatGrams, milligrams, toPersianDigits } from '@sharghigold/money';

import { persianCount, toman, weightLabel } from '@/lib/product-view';

export { persianCount, toman, weightLabel } from '@/lib/product-view';

/* -------------------------------------------------------------------------- */
/* Amounts                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A bill line's figure, with its sign.
 *
 * A discount arrives as a negative string and is written «−۲٬۰۰۰٬۰۰۰» with a
 * true minus sign, not a hyphen: at this size in a right-to-left line a hyphen
 * reads as a dash between two numbers.
 */
export function signedToman(amountRials: string): string {
  return amountRials.startsWith('-') ? `−${toman(amountRials.slice(1))}` : toman(amountRials);
}

/** «رایگان» where a fee is nothing, because a «۰» invites a second look. */
export function feeLabel(amountRials: string): string {
  return amountRials === '0' ? 'رایگان' : toman(amountRials);
}

/* -------------------------------------------------------------------------- */
/* The bill                                                                   */
/* -------------------------------------------------------------------------- */

const BILL_NAME: Record<BillLineKind, string> = {
  'gold-value': 'ارزش طلا',
  'making-fee': 'اجرت ساخت',
  profit: 'سود فروشنده',
  vat: 'مالیات بر ارزش افزوده (۹٪)',
  discount: 'تخفیف',
  'gift-wrap': 'بسته‌بندی هدیه',
  shipping: 'هزینه ارسال',
  pickup: 'تحویل حضوری در شعبه',
};

/**
 * What a bill line is called.
 *
 * The gold line carries the weight it was computed from, because the whole
 * point of showing a breakdown is that a customer can check it against the
 * day's rate. A discount carries the name of the code that produced it.
 */
export function billLabel(line: BillLine, weightMilligrams: string): string {
  if (line.kind === 'gold-value') {
    return `${BILL_NAME[line.kind]} (${weightLabel(weightMilligrams)})`;
  }
  if (line.kind === 'discount' && line.detail !== null) {
    return `${BILL_NAME[line.kind]} ${line.detail}`;
  }
  return BILL_NAME[line.kind];
}

/** Discounts read in green, a free fee in green, everything else plainly. */
export function billTone(line: BillLine): 'credit' | 'free' | 'plain' {
  if (line.kind === 'discount') return 'credit';
  if (
    (line.kind === 'shipping' || line.kind === 'pickup') &&
    (line.amountRials === '0' || line.amountRials === '-0')
  ) {
    return 'free';
  }
  return 'plain';
}

export function billValue(line: BillLine): string {
  return billTone(line) === 'free' ? 'رایگان' : signedToman(line.amountRials);
}

/* -------------------------------------------------------------------------- */
/* A basket line                                                              */
/* -------------------------------------------------------------------------- */

/**
 * «سایز ۵۴ · طلای زرد · ۲٫۸۰ گرم» — what distinguishes this line.
 *
 * The weight quoted is one piece's, derived by dividing the line's weight by
 * its quantity. Exact: the line weight is the unit weight multiplied, so the
 * division has no remainder.
 */
export function lineSpec(line: {
  readonly size: number | null;
  readonly colourLabel: string;
  readonly weightMilligrams: string;
  readonly quantity: number;
}): string {
  const unit = BigInt(line.weightMilligrams) / BigInt(line.quantity);
  const parts = [
    line.size === null ? undefined : `سایز ${persianCount(line.size)}`,
    `طلای ${line.colourLabel}`,
    formatGrams(milligrams(unit), { withUnit: true, fractionDigits: 2 }),
  ];

  return parts.filter((part): part is string => part !== undefined).join(' · ');
}

/** «تنها ۳ عدد در انبار مانده است», shown only where it is nearly true. */
export const LOW_STOCK_AT = 2;

export function lowStockNote(remaining: number): string {
  return `تنها ${persianCount(remaining)} عدد در انبار مانده است`;
}

export function countLabel(items: number): string {
  return items === 0 ? 'خالی' : `${persianCount(items)} قطعه`;
}

export function savedCountLabel(items: number): string {
  return items === 0 ? 'خالی' : `${persianCount(items)} کالا`;
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

export const CHECKOUT_STEPS: readonly string[] = ['دریافت', 'پرداخت', 'بازبینی', 'پایان'];

export const DELIVERY_MODES: Record<DeliveryMode, string> = {
  ship: 'ارسال به آدرس',
  pickup: 'تحویل در شعبه',
};

interface PaymentCopy {
  readonly label: string;
  readonly note: string;
}

export const PAYMENT_COPY: Record<CheckoutPayment, PaymentCopy> = {
  gateway: {
    label: 'درگاه پرداخت بانکی',
    note: 'پرداخت آنی با کارت‌های عضو شتاب',
  },
  wallet: {
    label: 'کیف پول زرنما',
    note: 'پرداخت بدون انتقال به درگاه',
  },
  installment: {
    label: 'خرید اقساطی',
    note: 'پیش‌پرداخت ۴۰٪ و بازپرداخت ماهانه',
  },
};

export const PAYMENT_ORDER: readonly CheckoutPayment[] = ['gateway', 'wallet', 'installment'];

/* -------------------------------------------------------------------------- */
/* Collection windows                                                         */
/* -------------------------------------------------------------------------- */

const SLOT_DATE = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Tehran',
});

/**
 * «امروز ۱۵ تا ۱۸», «فردا ۱۰ تا ۱۳», «۵ شهریور ۱۰ تا ۱۳».
 *
 * The day is named relative to today where a customer would name it that way,
 * and by its Persian date otherwise. Both halves are computed from the slot's
 * own date rather than written down, so the list cannot go stale.
 */
export function slotLabel(
  slot: { readonly date: string; readonly fromHour: number; readonly toHour: number },
  todayIso: string,
): string {
  const hours = `${persianCount(slot.fromHour)} تا ${persianCount(slot.toHour)}`;
  const days = dayGap(todayIso, slot.date);

  if (days === 0) return `امروز ${hours}`;
  if (days === 1) return `فردا ${hours}`;

  return `${SLOT_DATE.format(Date.parse(`${slot.date}T09:00:00.000Z`))} ${hours}`;
}

function dayGap(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/* -------------------------------------------------------------------------- */
/* How it ended                                                               */
/* -------------------------------------------------------------------------- */

interface ResultCopy {
  readonly head: string;
  readonly title: string;
  readonly note: string;
  readonly tone: 'good' | 'bad' | 'idle';
  /** Whether offering another attempt makes sense. */
  readonly retry: boolean;
}

export const ORDER_RESULT: Record<OrderPaymentState, ResultCopy> = {
  paid: {
    head: 'سفارش ثبت شد',
    title: 'پرداخت شما موفق بود',
    note: 'سفارش شما ثبت شد و پس از آماده‌سازی و پلمب در کارگاه ارسال می‌شود. کد پیگیری از طریق پیامک برای شما فرستاده می‌شود.',
    tone: 'good',
    retry: false,
  },
  failed: {
    head: 'پرداخت ناموفق',
    title: 'پرداخت انجام نشد',
    note: 'تراکنش از سوی بانک تأیید نشد و مبلغی از حساب شما کسر نشده است. سبد خرید شما دست‌نخورده باقی مانده است.',
    tone: 'bad',
    retry: true,
  },
  canceled: {
    head: 'پرداخت لغو شد',
    title: 'پرداخت لغو شد',
    note: 'شما پرداخت را در درگاه بانکی لغو کردید. هیچ مبلغی کسر نشده و سبد خرید شما دست‌نخورده است.',
    tone: 'idle',
    retry: true,
  },
  pending: {
    head: 'در انتظار بانک',
    title: 'نتیجه پرداخت هنوز مشخص نیست',
    note: 'بانک هنوز پاسخی نداده است. تا دقایقی دیگر وضعیت سفارش مشخص می‌شود و پیامک آن برای شما ارسال می‌گردد.',
    tone: 'idle',
    retry: false,
  },
};

const FAILURE_NOTE: Record<NonNullable<PlacedOrder['failureReason']>, string> = {
  declined: 'انصراف یا اتمام مهلت درگاه',
  abandoned: 'پرداخت در درگاه لغو شد',
  'insufficient-funds': 'موجودی کیف پول کافی نبود',
};

/** The rows the result screen lists, built from the order's own snapshot. */
export function resultRows(order: PlacedOrder): readonly (readonly [string, string])[] {
  const rows: (readonly [string, string])[] = [
    ['شماره سفارش', toPersianDigits(order.code)],
    [order.paymentState === 'paid' ? 'مبلغ پرداختی' : 'مبلغ', `${toman(order.paidRials)} تومان`],
    ['روش پرداخت', order.paymentLabel],
  ];

  if (order.reference !== null) {
    rows.push(['کد پیگیری بانک', toPersianDigits(order.reference)]);
  }

  if (order.failureReason !== null) {
    rows.push(['علت', FAILURE_NOTE[order.failureReason]]);
  } else {
    rows.push([order.deliveryMode === 'pickup' ? 'محل تحویل' : 'تحویل', order.deliveryLabel]);
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* What went wrong on the way in                                              */
/* -------------------------------------------------------------------------- */

export const CODE_PROBLEM = {
  empty: 'کد تخفیف را وارد کنید.',
  malformed: 'این کد معتبر نیست یا مهلت آن گذشته است.',
  unknown: 'این کد معتبر نیست یا مهلت آن گذشته است.',
  'nothing-to-discount': 'سبد خرید شما خالی است.',
} as const;

export const PLACE_PROBLEM = {
  'empty-basket': 'سبد خرید شما خالی است.',
  'lock-expired': 'مهلت قیمت به پایان رسیده است؛ به سبد برگردید و قیمت‌ها را به‌روزرسانی کنید.',
  'terms-required': 'برای ادامه، قوانین خرید را بپذیرید.',
  'delivery-incomplete': 'اطلاعات دریافت سفارش کامل نیست.',
  'payment-incomplete': 'اطلاعات فاکتور رسمی را کامل کنید.',
  'method-unavailable': 'پرداخت آنلاین در این محیط در دسترس نیست.',
  'stale-intent': 'این صفحه تازه نیست؛ سفارش را دوباره بازبینی کنید.',
} as const;

export const TRUST_POINTS: readonly {
  readonly icon: 'invoice' | 'shield' | 'truck';
  readonly label: string;
}[] = [
  { icon: 'invoice', label: 'فاکتور رسمی' },
  { icon: 'shield', label: 'ضمانت اصالت' },
  { icon: 'truck', label: 'بیمه ارسال' },
];

export const TAX_NOTE =
  'اجرت ساخت و سود فروشنده برای هر قطعه جداگانه محاسبه شده و مالیات بر ارزش افزوده ۹٪ تنها به اجرت و سود تعلق می‌گیرد؛ ارزش طلا معاف است.';

export const PICKUP_NOTE =
  'برای تحویل حضوری، کارت ملی یا شناسنامه سفارش‌دهنده را همراه داشته باشید. کالا در حضور شما وزن‌کشی و تحویل می‌شود.';

export const INSTALLMENT_NOTE =
  'برای خرید اقساطی، احراز هویت و تأیید اعتبار لازم است. پس از پرداخت پیش‌پرداخت، مراحل احراز هویت آغاز می‌شود.';

/**
 * What a redirect is allowed to say went wrong.
 *
 * The same construction as the flash table: the URL carries a key from this
 * list and never a sentence, because a page that prints arbitrary query text
 * is a phishing page hosted on the shop's own domain.
 */
export const CART_PROBLEM: Record<string, string> = {
  'not-added': 'این کالا به سبد اضافه نشد. دوباره تلاش کنید.',
  'unknown-product': 'این کالا دیگر در دسترس نیست.',
  'unavailable-size': 'این سایز موجود نیست. سایز دیگری انتخاب کنید.',
  'out-of-stock': 'موجودی انبار برای این تعداد کافی نیست.',
  'basket-full': 'سبد خرید پر است. برای افزودن کالای تازه، یکی را حذف کنید.',
  empty: 'سبد خرید شما خالی است.',
  'lock-expired': 'مهلت قیمت به پایان رسیده است. قیمت‌ها را به‌روزرسانی کنید.',
};

export function cartProblem(key: string | undefined): string | undefined {
  return key === undefined ? undefined : CART_PROBLEM[key];
}
