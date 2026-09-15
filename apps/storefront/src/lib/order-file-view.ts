/**
 * How the Orders pages say things.
 *
 * Keys in, Persian out. The server decides what an order is doing and what it
 * allows; this file only chooses the words, the tone class and the calendar,
 * so the shop's voice lives in one place rather than in nine pages.
 */
import type {
  CancelReason,
  GoldColour,
  Instalment,
  OrderEventKind,
  OrderFile,
  OrderGroup,
  OrderLine,
  OrderOutcome,
  RefundDestination,
  ReturnReason,
  ReturnStage,
  ReviewTag,
} from '@sharghigold/contracts';
import { formatGrams, milligrams, toPersianDigits } from '@sharghigold/money';

/* -------------------------------------------------------------------------- */
/* The list                                                                   */
/* -------------------------------------------------------------------------- */

export const ORDER_GROUPS: readonly OrderGroup[] = [
  'all',
  'processing',
  'shipped',
  'delivered',
  'returns',
  'cancelled',
];

export const ORDER_GROUP_LABEL: Record<OrderGroup, string> = {
  all: 'همه',
  processing: 'جاری',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  returns: 'مرجوعی',
  cancelled: 'لغوشده',
};

/** The four tones the canvas colours a pill with. Mapped to classes, never colours. */
export type OrderTone = 'warn' | 'info' | 'ok' | 'bad';

/* -------------------------------------------------------------------------- */
/* Dates, codes and pieces                                                    */
/* -------------------------------------------------------------------------- */

const TEHRAN = 'Asia/Tehran';

const DAY_MONTH = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  day: 'numeric',
  month: 'long',
  timeZone: TEHRAN,
});

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TEHRAN,
});

const CLOCK = new Intl.DateTimeFormat('fa-IR-u-nu-arabext', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TEHRAN,
});

/** «۲۵ مرداد» */
export function dayMonth(iso: string): string {
  return DAY_MONTH.format(Date.parse(iso));
}

/** «۲۱ مرداد ۱۴۰۵» */
export function dayMonthYear(iso: string): string {
  return DAY_MONTH_YEAR.format(Date.parse(iso));
}

/** «۱۴:۰۲» */
export function clock(iso: string): string {
  return CLOCK.format(Date.parse(iso));
}

/** «۲۱ مرداد · ۱۴:۰۲» */
export function dayMonthClock(iso: string): string {
  return `${dayMonth(iso)} · ${clock(iso)}`;
}

/** «۲۱ مرداد ۱۴۰۵ · ۱۴:۰۲» */
export function fullDateClock(iso: string): string {
  return `${dayMonthYear(iso)} · ${clock(iso)}`;
}

/** «ZN-۸۸۴۱۲»: the prefix stays Latin, the number reads in Persian. */
export function orderCodeLabel(code: string): string {
  return toPersianDigits(code);
}

/** «۰۹۱۲ ۰۰۰ ۱۲۳۴» */
export function mobileGroups(mobile: string): string {
  return toPersianDigits(`${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}`);
}

const COLOUR_LABEL: Record<GoldColour, string> = {
  yellow: 'طلای زرد',
  white: 'طلای سفید',
  rose: 'رزگلد',
};

/** «سایز ۵۴ · ۳٫۲ گرم · طلای زرد» */
export function lineSpec(line: OrderLine): string {
  return [
    line.size === null ? null : `سایز ${toPersianDigits(String(line.size))}`,
    formatGrams(milligrams(BigInt(line.weightMilligrams))),
    line.colour === null ? null : COLOUR_LABEL[line.colour],
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

export function gramsLabel(weightMilligrams: string): string {
  return formatGrams(milligrams(BigInt(weightMilligrams)));
}

/* -------------------------------------------------------------------------- */
/* Where an order has got to                                                  */
/* -------------------------------------------------------------------------- */

function nextUnpaid(order: OrderFile): Instalment | undefined {
  return order.instalments?.schedule.find((instalment) => instalment.paidAt === null);
}

/** The return a customer is still waiting on, if any. */
export function liveReturn(order: OrderFile): OrderFile['returnRequest'] {
  const request = order.returnRequest;
  return request === null || request.stage === 'withdrawn' ? null : request;
}

export const RETURN_STAGE_LABEL: Record<ReturnStage, string> = {
  reviewing: 'در حال بررسی مرجوعی',
  collecting: 'در انتظار دریافت کالا',
  inspecting: 'در حال بررسی کالا',
  refunded: 'مرجوعی تسویه شد',
  withdrawn: 'مرجوعی لغو شد',
};

/** The pill: what an order is doing, in one phrase and one tone. */
export function orderStatus(order: OrderFile): {
  readonly label: string;
  readonly tone: OrderTone;
} {
  if (order.state === 'cancelled') return { label: 'لغو شد', tone: 'bad' };

  const request = liveReturn(order);
  if (request !== null) {
    return {
      label: RETURN_STAGE_LABEL[request.stage],
      tone: request.stage === 'refunded' ? 'ok' : 'warn',
    };
  }

  if (nextUnpaid(order) !== undefined) return { label: 'اقساطی · فعال', tone: 'info' };
  if (order.state === 'processing') return { label: 'در حال آماده‌سازی', tone: 'warn' };
  if (order.state === 'shipped') return { label: 'ارسال شد', tone: 'info' };
  return { label: 'تحویل شد', tone: 'ok' };
}

/** Which of a card's four bars are gold: placed, prepared, sent, delivered. */
export function progressStep(order: OrderFile): number {
  return order.state === 'processing' ? 1 : order.state === 'shipped' ? 2 : 3;
}

/** The line under a card's bars. */
export function progressNote(order: OrderFile): string {
  const request = liveReturn(order);
  if (request !== null) {
    return request.stage === 'reviewing'
      ? 'بررسی درخواست مرجوعی در جریان است'
      : RETURN_STAGE_LABEL[request.stage];
  }

  const due = nextUnpaid(order);
  if (due !== undefined && order.state === 'delivered') return `قسط بعدی: ${dayMonth(due.dueAt)}`;

  if (order.state === 'delivered') {
    return order.shipment.deliveredAt === null
      ? 'تحویل شد'
      : `تحویل شد در ${dayMonth(order.shipment.deliveredAt)}`;
  }

  return order.shipment.estimatedAt === null
    ? 'زمان تحویل پس از ارسال اعلام می‌شود'
    : `تحویل تخمینی: ${dayMonth(order.shipment.estimatedAt)}`;
}

/** The paragraph on the order's teal header. */
export function orderHeadline(order: OrderFile): string {
  if (order.state === 'cancelled') {
    return 'این سفارش لغو شد و مبلغ پرداختی آن به کیف پول زرنما بازگردانده شد.';
  }

  const request = liveReturn(order);
  if (request !== null) {
    return request.stage === 'refunded'
      ? 'درخواست مرجوعی شما تسویه شد و مبلغ آن واریز شد.'
      : 'درخواست مرجوعی شما ثبت شده و کارشناس ارزیابی در حال بررسی آن است.';
  }

  if (nextUnpaid(order) !== undefined && order.state === 'delivered') {
    return 'سفارش اقساطی شما تحویل شده است. اقساط باقی‌مانده را از همین صفحه پرداخت کنید.';
  }

  if (order.state === 'processing') {
    return order.delivery.mode === 'pickup'
      ? 'سفارش شما در کارگاه در حال آماده‌سازی و پلمب است. وقتی برای تحویل در شعبه آماده شد، پیامک می‌گیرید.'
      : 'سفارش شما در کارگاه در حال آماده‌سازی و پلمب است. پس از تحویل به پست، کد رهگیری برایتان پیامک می‌شود.';
  }

  if (order.state === 'shipped') {
    return 'مرسوله تحویل شرکت حمل شده است و در مسیر رسیدن به شما قرار دارد.';
  }

  return order.shipment.deliveredAt === null
    ? 'این سفارش تحویل شما شده است.'
    : `این سفارش در ${dayMonth(order.shipment.deliveredAt)} تحویل شما شد.${
        order.allowed.requestReturn ? ' تا ۷ روز پس از تحویل امکان مرجوع کردن دارید.' : ''
      }`;
}

export const ORDER_STEP_LABELS: readonly string[] = ['ثبت سفارش', 'آماده‌سازی', 'ارسال', 'تحویل'];

/**
 * The stepper's current stage.
 *
 * Delivered is past the last dot, so every dot is ticked. The canvas leaves
 * «تحویل» as the stage in progress, which reads as a parcel still on its way.
 */
export function stepperCurrent(order: OrderFile): number {
  return order.state === 'processing' ? 1 : order.state === 'shipped' ? 2 : 4;
}

export const EVENT_LABEL: Record<OrderEventKind, string> = {
  placed: 'سفارش ثبت شد',
  paid: 'پرداخت تأیید شد',
  'credit-approved': 'تأیید اعتبار اقساطی',
  preparing: 'آماده‌سازی و پلمب در کارگاه',
  'handed-to-carrier': 'تحویل به شرکت پست',
  'at-hub': 'در مرکز مبادلات',
  'out-for-delivery': 'در دست مأمور توزیع',
  'ready-for-pickup': 'آماده تحویل در شعبه',
  delivered: 'تحویل به گیرنده',
  cancelled: 'لغو به درخواست مشتری',
  refunded: 'بازگشت وجه',
  'return-requested': 'ثبت درخواست مرجوعی',
  'return-reviewed': 'بررسی کارشناس',
  'return-collected': 'دریافت کالا از شما',
  'return-refunded': 'بازگشت وجه مرجوعی',
  'return-withdrawn': 'انصراف از مرجوعی',
};

/* -------------------------------------------------------------------------- */
/* Choices                                                                    */
/* -------------------------------------------------------------------------- */

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  'not-needed': 'دیگر به این کالا نیاز ندارم',
  'better-price': 'قیمت مناسب‌تری پیدا کردم',
  'wrong-choice': 'اشتباه در انتخاب سایز یا مدل',
  'slow-delivery': 'زمان تحویل طولانی است',
  'change-order': 'می‌خواهم سفارش را تغییر دهم',
};

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  'photo-mismatch': 'کالا با تصویر سایت تفاوت دارد',
  size: 'سایز مناسب نیست',
  damaged: 'کالا آسیب‌دیده رسید',
  'weight-mismatch': 'وزن با فاکتور نمی‌خواند',
  'changed-mind': 'نظرم عوض شد',
};

export const REFUND_DESTINATION: Record<
  RefundDestination,
  { readonly label: string; readonly note: string }
> = {
  wallet: { label: 'کیف پول زرنما', note: 'واریز پس از تأیید کارشناس' },
  bank: { label: 'حساب بانکی', note: 'به شبای تأییدشده حساب شما' },
};

export const REVIEW_TAG_LABEL: Record<ReviewTag, string> = {
  'clean-finish': 'ساخت تمیز',
  'photo-match': 'مطابق تصویر',
  packaging: 'بسته‌بندی خوب',
  'fast-delivery': 'ارسال سریع',
  'fair-fee': 'اجرت منصفانه',
};

export const RATING_WORDS: readonly string[] = ['', 'ضعیف', 'قابل قبول', 'متوسط', 'خوب', 'عالی'];

export const QUICK_ASKS: readonly string[] = [
  'سفارشم کی ارسال می‌شود؟',
  'می‌خواهم آدرس را تغییر دهم',
  'فاکتور رسمی می‌خواهم',
];

/* -------------------------------------------------------------------------- */
/* Returns and instalments                                                    */
/* -------------------------------------------------------------------------- */

export const RETURN_STEP_LABELS: readonly string[] = [
  'ثبت درخواست',
  'بررسی کارشناس',
  'دریافت کالا',
  'بازگشت وجه',
];

export function returnStepperCurrent(stage: ReturnStage): number {
  return stage === 'reviewing' ? 1 : stage === 'collecting' ? 2 : stage === 'inspecting' ? 3 : 4;
}

/** «مراحل بعدی», per stage. Says what happens next, never a day nobody has fixed. */
export function returnNextSteps(stage: ReturnStage): string {
  switch (stage) {
    case 'reviewing':
      return 'کارشناس ما درخواست را بررسی می‌کند و برای هماهنگی دریافت کالا با شما تماس می‌گیرد. تا آن زمان کالا را در بسته‌بندی اصلی همراه فاکتور نگه دارید. پس از دریافت و تأیید کالا، مبلغ به مقصد انتخابی واریز می‌شود.';
    case 'collecting':
      return 'کالا را در بسته‌بندی اصلی همراه فاکتور آماده کنید تا در زمان هماهنگ‌شده از شما دریافت شود.';
    case 'inspecting':
      return 'کالا دریافت شده و در حال وزن‌کشی و بررسی است. پس از تأیید، مبلغ به مقصد انتخابی واریز می‌شود.';
    case 'refunded':
      return 'مبلغ مرجوعی به مقصد انتخابی واریز شده است.';
    case 'withdrawn':
      return 'این درخواست را لغو کرده‌اید. تا پایان مهلت مرجوعی می‌توانید دوباره درخواست دهید.';
  }
}

/** A schedule row's words and tone. */
export function instalmentState(
  instalment: Instalment,
  now: number,
): { readonly label: string; readonly tone: OrderTone | 'idle' } {
  if (instalment.paidAt !== null) return { label: 'پرداخت شد', tone: 'ok' };
  const due = Date.parse(instalment.dueAt);
  if (due < now) return { label: 'سررسید گذشته', tone: 'bad' };
  if (due - now <= 10 * 86_400_000) return { label: 'سررسید نزدیک', tone: 'warn' };
  return { label: 'در انتظار', tone: 'idle' };
}

/**
 * The part of the schedule the canvas shows: the last instalment paid and the
 * next two, so a twelve-month plan stays three rows tall.
 */
export function instalmentWindow(schedule: readonly Instalment[]): readonly Instalment[] {
  const next = schedule.findIndex((instalment) => instalment.paidAt === null);
  const start = next === -1 ? Math.max(0, schedule.length - 3) : Math.max(0, next - 1);
  return schedule.slice(start, start + 3);
}

export const ORDER_OUTCOME_TITLE: Record<OrderOutcome, string> = {
  cancelled: 'سفارش لغو شد',
  returned: 'درخواست مرجوعی ثبت شد',
  reviewed: 'نظر شما ثبت شد',
  'instalment-paid': 'قسط پرداخت شد',
};
