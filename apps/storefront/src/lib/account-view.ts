/**
 * How the account pages say things.
 *
 * The one place Persian wording and Persian numerals are applied to account
 * data. Everything below the server gateway deals in keys, digits and ISO
 * instants; a component that formatted its own would put the shop's voice in
 * twenty files and its calendar in ten.
 *
 * Nothing here computes. `toman` groups a string of rials that the server
 * already decided; the state labels are a lookup; the date is `Intl` doing the
 * Persian calendar properly rather than arithmetic pretending to.
 */
import type {
  AddressLabel,
  DeviceKind,
  KycStatus,
  KycStepKey,
  OrderFilter,
  OrderState,
} from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';

export { persianCount, persianDecimal, relativeTime, toman, weightLabel } from './product-view';

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A day in the Iranian calendar, as «۲۱ مرداد ۱۴۰۵».
 *
 * `Intl` with the Persian calendar rather than a conversion of our own: the
 * leap rule, the month names and the numerals are all data the platform
 * already has, and a hand-rolled version of any of them is a bug waiting for
 * an edge year.
 *
 * Pinned to Tehran. Formatting an instant in the server's zone would move an
 * order placed late in the evening to the following day.
 */
const DAY_FORMAT = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Tehran',
});

export function jalaliDate(iso: string): string {
  const at = Date.parse(iso);
  return Number.isNaN(at) ? '' : DAY_FORMAT.format(at);
}

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

/** A mobile number in Persian numerals, unchanged otherwise. */
export function mobileLabel(mobile: string): string {
  return toPersianDigits(mobile);
}

/**
 * A string of digits in Persian numerals, leading zeros kept.
 *
 * For a code rather than a quantity: `persianCount` takes a number, and a
 * number cannot hold the leading zero of «۰۴۸۲۹».
 */
export function codeLabel(digits: string): string {
  return toPersianDigits(digits);
}

/**
 * The letter shown in the avatar.
 *
 * `Array.from` rather than `charAt`: a Persian name can begin with a codepoint
 * outside the basic plane, and half a character in a circle is a mojibake box.
 */
export function initialOf(displayName: string | null): string {
  const name = displayName?.trim() ?? '';
  return name === '' ? 'ز' : (Array.from(name)[0] ?? 'ز');
}

export function nameOrDefault(displayName: string | null): string {
  const name = displayName?.trim() ?? '';
  return name === '' ? 'کاربر زرنما' : name;
}

/* -------------------------------------------------------------------------- */
/* Verification                                                               */
/* -------------------------------------------------------------------------- */

export interface KycCopy {
  /** The badge beside «احراز هویت». */
  readonly badge: string;
  /** The line under it on the account home. */
  readonly hint: string;
  readonly title: string;
  readonly body: string;
  /** Which of the four tones the card is painted in. */
  readonly tone: 'idle' | 'pending' | 'good' | 'bad';
}

export const KYC_COPY: Record<KycStatus, KycCopy> = {
  none: {
    badge: 'تأیید نشده',
    hint: 'برای خرید اقساطی و برداشت وجه لازم است',
    title: 'هویت خود را تأیید کنید',
    body: 'سه گام کوتاه، حدود دو دقیقه. پس از تأیید، خرید اقساطی و برداشت وجه برایتان فعال می‌شود.',
    tone: 'idle',
  },
  pending: {
    badge: 'در حال بررسی',
    hint: 'نتیجه تا حداکثر ۲۴ ساعت آینده اعلام می‌شود',
    title: 'مدارک شما در حال بررسی است',
    body: 'کارشناسان ما مدارک ارسالی را بررسی می‌کنند. نتیجه با پیامک به شما اطلاع داده می‌شود.',
    tone: 'pending',
  },
  verified: {
    badge: 'تأییدشده',
    hint: 'همه امکانات حساب شما فعال است',
    title: 'هویت شما تأیید شده است',
    body: 'خرید اقساطی، برداشت وجه و صدور فاکتور رسمی به نام شما فعال است.',
    tone: 'good',
  },
  rejected: {
    badge: 'رد شده',
    hint: 'مدارک را دوباره ارسال کنید',
    title: 'احراز هویت تأیید نشد',
    body: 'یکی از مدارک ارسالی قابل تأیید نبود. با اصلاح مورد زیر می‌توانید دوباره ارسال کنید.',
    tone: 'bad',
  },
};

export const KYC_STEP_NAME: Record<KycStepKey, string> = {
  identity: 'اطلاعات هویتی',
  bank: 'حساب بانکی',
  selfie: 'تصویر چهره',
};

export const KYC_STEP_NOTE: Record<KycStepKey, string> = {
  identity: 'کد ملی و تاریخ تولد',
  bank: 'شماره شبا به نام خودتان',
  selfie: 'سلفی همراه کد نمایش‌داده‌شده',
};

export const KYC_STEP_HEADING: Record<KycStepKey, string> = {
  identity: 'اطلاعات هویتی خود را وارد کنید',
  bank: 'حساب بانکی خود را ثبت کنید',
  selfie: 'یک تصویر از چهره‌تان بفرستید',
};

export const KYC_STEP_LEAD: Record<KycStepKey, string> = {
  identity:
    'این اطلاعات با سامانه ثبت احوال تطبیق داده می‌شود؛ باید با شماره موبایل شما هم‌خوان باشد.',
  bank: 'بازگشت وجه و تسویه اقساط فقط به حساب بانکی به نام خودتان انجام می‌شود.',
  selfie: 'برای اطمینان از اینکه خودتان درخواست را ثبت کرده‌اید، یک تصویر همراه کد زیر لازم است.',
};

/** The order the steps are worked through, and the routes they live at. */
export const KYC_STEPS: readonly KycStepKey[] = ['identity', 'bank', 'selfie'];

export const KYC_STEP_PATH: Record<KycStepKey, string> = {
  identity: '/account/identity/details',
  bank: '/account/identity/bank',
  selfie: '/account/identity/selfie',
};

export const KYC_BENEFITS: readonly string[] = [
  'خرید اقساطی و انتقال اعتبار شرکت‌های همکار',
  'برداشت وجه از کیف پول به حساب خودتان',
  'افزایش سقف خرید روزانه تا ۵۰۰ میلیون تومان',
  'صدور فاکتور رسمی به نام شما',
];

export const SELFIE_RULES: readonly string[] = [
  'چهره و کاغذ هر دو کامل و واضح دیده شوند.',
  'در نور کافی و بدون عینک آفتابی یا ماسک عکس بگیرید.',
  'کارت ملی خود را کنار چهره نگه دارید.',
];

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export const ORDER_STATE_LABEL: Record<OrderState, string> = {
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شد',
  delivered: 'تحویل شد',
  cancelled: 'لغو شد',
};

/** Which tone the status pill takes. Mapped to a class, never to a colour. */
export const ORDER_STATE_TONE: Record<OrderState, 'open' | 'good' | 'muted'> = {
  processing: 'open',
  shipped: 'open',
  delivered: 'good',
  cancelled: 'muted',
};

export const ORDER_FILTER_LABEL: Record<OrderFilter, string> = {
  all: 'همه',
  open: 'جاری',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
};

export const ORDER_FILTERS: readonly OrderFilter[] = ['all', 'open', 'delivered', 'cancelled'];

/** The four dots on the progress bar of an order in flight. */
export const ORDER_STEPS: readonly string[] = ['ثبت سفارش', 'آماده‌سازی', 'ارسال', 'تحویل'];

/**
 * What the second button on an order card offers.
 *
 * A cancelled order offers the product again; a delivered one offers a review;
 * one in flight offers tracking. Each is a link, so each needs somewhere real
 * to go — `href` is null where that place does not exist yet, and the button
 * is not drawn rather than drawn dead.
 */
export function orderActionLabel(state: OrderState): string {
  return state === 'cancelled'
    ? 'خرید دوباره'
    : state === 'delivered'
      ? 'ثبت دیدگاه'
      : 'پیگیری مرسوله';
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                  */
/* -------------------------------------------------------------------------- */

export const ADDRESS_LABEL_TEXT: Record<AddressLabel, string> = {
  home: 'خانه',
  work: 'محل کار',
  other: 'دیگر',
};

export const ADDRESS_LABELS: readonly AddressLabel[] = ['home', 'work', 'other'];

/**
 * The address on one line, the way a courier reads it.
 *
 * Built here rather than stored, so that editing a field changes the label
 * everywhere it appears instead of leaving a stale sentence behind.
 */
export function addressLine(address: {
  readonly province: string;
  readonly city: string;
  readonly line: string;
  readonly plate: string;
  readonly unit: string | null;
}): string {
  const head =
    address.province === address.city ? address.city : `${address.province}، ${address.city}`;
  const unit = address.unit === null || address.unit === '' ? '' : `، واحد ${address.unit}`;

  return `${head}، ${address.line}، پلاک ${address.plate}${unit}`;
}

export function postalLabel(postalCode: string): string {
  return `کد پستی ${toPersianDigits(postalCode)}`;
}

/* -------------------------------------------------------------------------- */
/* Devices                                                                    */
/* -------------------------------------------------------------------------- */

export const DEVICE_KIND_LABEL: Record<DeviceKind, string> = {
  phone: 'گوشی',
  desktop: 'رایانه',
  app: 'اپلیکیشن',
};

/**
 * «تهران · ۳ روز پیش», or just the time when there is no place.
 *
 * No geolocation service is wired up, so `place` is null for every session
 * created today. Writing the separator only when there is something on both
 * sides of it keeps a stray «· » off the page.
 */
export function deviceMeta(place: string | null, lastSeenAt: string, now: Date): string {
  const when = relativeMinutes(lastSeenAt, now);
  return place === null ? when : `${place} · ${when}`;
}

const MINUTE_MS = 60_000;

/** Like `relativeTime`, but says «هم‌اکنون» for the last few minutes. */
export function relativeMinutes(iso: string, now: Date): string {
  const elapsed = now.getTime() - Date.parse(iso);
  if (Number.isNaN(elapsed)) return '';
  if (elapsed < 5 * MINUTE_MS) return 'هم‌اکنون فعال';
  if (elapsed < 60 * MINUTE_MS) {
    return `${toPersianDigits(String(Math.floor(elapsed / MINUTE_MS)))} دقیقه پیش`;
  }
  if (elapsed < 24 * 60 * MINUTE_MS) {
    return `${toPersianDigits(String(Math.floor(elapsed / (60 * MINUTE_MS))))} ساعت پیش`;
  }

  const days = Math.floor(elapsed / (24 * 60 * MINUTE_MS));
  if (days === 1) return 'دیروز';
  if (days < 30) return `${toPersianDigits(String(days))} روز پیش`;

  return `${toPersianDigits(String(Math.floor(days / 30)))} ماه پیش`;
}

/* -------------------------------------------------------------------------- */
/* Flash messages                                                             */
/* -------------------------------------------------------------------------- */

/**
 * What a redirect after a write is allowed to say.
 *
 * The design shows a toast after every action. With real navigations that
 * becomes a message carried in the URL — and a message carried in the URL is
 * text a stranger can put in a link. So the URL carries a *key* from this
 * table and never the sentence, which is the difference between a confirmation
 * and a phishing page hosted on the shop's own domain.
 */
export const FLASH: Record<string, string> = {
  welcome: 'خوش آمدید',
  saved: 'تغییرات ذخیره شد',
  'password-set': 'رمز عبور ثبت شد',
  'address-saved': 'آدرس با موفقیت ثبت شد',
  'address-updated': 'تغییرات آدرس ذخیره شد',
  'address-removed': 'آدرس حذف شد',
  'address-default': 'آدرس پیش‌فرض تغییر کرد',
  'kyc-submitted': 'مدارک شما ارسال شد',
  'device-revoked': 'دستگاه از حساب خارج شد',
  'devices-revoked': 'همه دستگاه‌های دیگر خارج شدند',
  'code-sent': 'کد تأیید دوباره ارسال شد',
  'cart-added': 'کالا به سبد خرید اضافه شد',
  'cart-removed': 'کالا از سبد حذف شد',
  'cart-kept': 'برای بعد ذخیره شد',
  'cart-restored': 'به سبد خرید برگشت',
  'cart-dropped': 'از ذخیره‌شده‌ها حذف شد',
  'cart-refreshed': 'قیمت‌ها با نرخ لحظه بازار به‌روز شد',
  'code-applied': 'کد تخفیف اعمال شد',
  'code-cleared': 'کد تخفیف برداشته شد',
};

/** The sentence for a flash key, or nothing if the key is not one of ours. */
export function flashMessage(key: string | undefined): string | undefined {
  return key === undefined ? undefined : FLASH[key];
}
