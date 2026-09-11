/**
 * Domain primitives shared by the API and the storefront.
 *
 * Every one of these is a *parser*, not a type assertion: the same schema
 * validates the request on the server and the form on the client, so the two
 * can never drift. Client-side validation is a convenience only — the server
 * re-parses everything it receives (rules 6 and 9).
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Iranian mobile numbers                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Accepts the shapes users actually type — 09123456789, +989123456789,
 * 00989123456789, 9123456789 — and normalises to the canonical 09XXXXXXXXX.
 *
 * Storing one canonical form matters: the phone number is the account identity
 * for OTP login, and two spellings of the same number must not become two
 * accounts.
 */
export const iranianMobileSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-()]/g, ''))
  .refine((value) => /^(?:\+98|0098|98|0)?9\d{9}$/.test(value), {
    message: 'شماره موبایل معتبر نیست',
  })
  .transform((value) => {
    const digits = value.replace(/^(?:\+98|0098|98|0)/, '');
    return `0${digits}`;
  });

export type IranianMobile = z.output<typeof iranianMobileSchema>;

/* -------------------------------------------------------------------------- */
/* Iranian national identifier (کد ملی)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Validate the check digit of an Iranian national ID.
 *
 * Ten digits. The first nine are weighted 10..2, summed, and taken modulo 11;
 * the tenth digit must equal that remainder when it is below 2, or 11 minus it
 * otherwise. Repdigit values such as 1111111111 satisfy the arithmetic but are
 * not issued, so they are rejected explicitly.
 *
 * KYC for installment purchases needs this, and catching a typo at the form is
 * far cheaper than failing midway through a credit check.
 */
export function isValidIranianNationalId(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  if (/^(\d)\1{9}$/.test(value)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(value[index]) * (10 - index);
  }

  const remainder = sum % 11;
  const checkDigit = Number(value[9]);

  return remainder < 2 ? checkDigit === remainder : checkDigit === 11 - remainder;
}

export const iranianNationalIdSchema = z
  .string()
  .trim()
  .refine(isValidIranianNationalId, { message: 'کد ملی معتبر نیست' });

/* -------------------------------------------------------------------------- */
/* Money and weight on the wire                                               */
/* -------------------------------------------------------------------------- */

/**
 * Rial amounts cross the wire as decimal strings, never as JSON numbers.
 *
 * `JSON.parse` produces a double, which cannot hold large rial totals exactly.
 * A string survives the round trip and is parsed back into a bigint by
 * `@sharghigold/money`.
 */
export const rialsStringSchema = z
  .string()
  .regex(/^-?\d+$/, { message: 'مبلغ باید عدد صحیح باشد' });

export const positiveRialsStringSchema = z
  .string()
  .regex(/^\d+$/, { message: 'مبلغ باید عدد صحیح نامنفی باشد' });

/** Weights cross the wire as whole milligrams, for the same reason. */
export const milligramsStringSchema = z
  .string()
  .regex(/^\d+$/, { message: 'وزن باید عدد صحیح نامنفی باشد' });

/** A rate in basis points. 1 bp = 0.01%; 10000 bp = 100%. */
export const basisPointsSchema = z.int().min(0).max(1_000_000);

/** Carat, as used in the Iranian trade. */
export const karatSchema = z.union([z.literal(18), z.literal(21), z.literal(22), z.literal(24)]);

export type Karat = z.output<typeof karatSchema>;

/* -------------------------------------------------------------------------- */
/* Identifiers and common strings                                             */
/* -------------------------------------------------------------------------- */

export const uuidSchema = z.uuid({ message: 'شناسه معتبر نیست' });

/**
 * URL slug. Restricted to lowercase Latin, digits and hyphens so that product
 * URLs stay stable and predictable even though titles are Persian.
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'اسلاگ معتبر نیست' });

/** A one-time password: exactly the configured number of digits, no spaces. */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, { message: 'کد تأیید معتبر نیست' });

/**
 * Free text supplied by a user.
 *
 * Length-bounded and stripped of control characters. This is not an XSS
 * defence — output encoding is (rules 10 and 11) — it just keeps obviously
 * malformed input out of the database.
 */
export const userTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Stripping happens BEFORE the emptiness check, not after. The other order
    // accepts a string of nothing but control characters — it satisfies
    // `min(1)`, then transforms to '' and is stored as empty.
    .transform(stripControlCharacters)
    .refine((value) => value.length > 0, { message: 'این مقدار نمی‌تواند خالی باشد' });

/**
 * Remove C0 and C1 control characters, which are never legitimate user input.
 *
 * Written as an explicit codepoint filter rather than a regex range so that the
 * intent stays readable and no control byte ever appears literally in source.
 */
export function stripControlCharacters(value: string): string {
  let out = '';
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    const isC0 = code <= 0x1f;
    const isC1 = code >= 0x7f && code <= 0x9f;
    if (!isC0 && !isC1) out += character;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Iranian bank account number (شماره شبا / IBAN)                              */
/* -------------------------------------------------------------------------- */

/**
 * Validate an Iranian IBAN with the ISO 13616 check.
 *
 * `IR` followed by twenty-four digits. The first two of those are check
 * digits: move the country code and the check digits to the end, replace the
 * letters with their positions (I = 18, R = 27), and the resulting number must
 * be congruent to 1 modulo 97.
 *
 * Refunds and instalment settlements are paid to this account and to no other,
 * so a transposed pair of digits is money sent to a stranger. The arithmetic
 * catches every single-digit error and every transposition, which is the whole
 * reason the check digits exist — and it costs nothing to run at the form.
 */
export function isValidIranianIban(value: string): boolean {
  if (!/^IR\d{24}$/.test(value)) return false;

  const rearranged = `${value.slice(4)}${value.slice(0, 4)}`;
  let numeric = '';
  for (const character of rearranged) {
    numeric +=
      character >= '0' && character <= '9'
        ? character
        : String(character.charCodeAt(0) - 'A'.charCodeAt(0) + 10);
  }

  return BigInt(numeric) % 97n === 1n;
}

/**
 * An IBAN as typed: with or without the `IR`, with the spaces banks print it
 * in. Normalised to the canonical `IR` + twenty-four digits.
 */
export const iranianIbanSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .transform((value) => (value.startsWith('IR') ? value : `IR${value}`))
  .refine(isValidIranianIban, { message: 'شماره شبا معتبر نیست' });

/* -------------------------------------------------------------------------- */
/* Dates in the Iranian calendar                                              */
/* -------------------------------------------------------------------------- */

/** Days in each Gregorian month of `year`. Index 1 is January. */
function gregorianMonthLengths(year: number): readonly number[] {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}

/**
 * Convert a Jalali date to its Gregorian equivalent, as `[year, month, day]`.
 *
 * Exact for the range the calendar's arithmetic leap rule covers, which spans
 * every date a customer could give as a birthday. Written in integers: a date
 * is not a quantity to be approximated.
 */
export function jalaliToGregorian(
  jalaliYear: number,
  jalaliMonth: number,
  jalaliDay: number,
): readonly [number, number, number] {
  const shifted = jalaliYear + 1595;
  let days =
    -355_668 +
    365 * shifted +
    Math.trunc(shifted / 33) * 8 +
    Math.trunc(((shifted % 33) + 3) / 4) +
    jalaliDay +
    (jalaliMonth < 7 ? (jalaliMonth - 1) * 31 : (jalaliMonth - 7) * 30 + 186);

  let year = 400 * Math.trunc(days / 146_097);
  days %= 146_097;

  if (days > 36_524) {
    days -= 1;
    year += 100 * Math.trunc(days / 36_524);
    days %= 36_524;
    if (days >= 365) days += 1;
  }

  year += 4 * Math.trunc(days / 1_461);
  days %= 1_461;

  if (days > 365) {
    year += Math.trunc((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let day = days + 1;
  const lengths = gregorianMonthLengths(year);
  let month = 1;
  while (month <= 12 && day > (lengths[month] ?? 0)) {
    day -= lengths[month] ?? 0;
    month += 1;
  }

  return [year, month, day];
}

/** True when `YYYY/MM/DD` names a day that exists in the Iranian calendar. */
export function isValidJalaliDate(value: string): boolean {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1_200 || year > 1_600) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Six months of 31 days, five of 30, and a last month of 29 or 30. The leap
  // rule is the same arithmetic the conversion above uses.
  const longMonth = month <= 6 ? 31 : month <= 11 ? 30 : ((year + 12) % 33) % 4 === 1 ? 30 : 29;

  return day <= longMonth;
}

/**
 * A birthday, written the way an Iranian identity document writes it.
 *
 * Latin digits after the storefront has latinised what was typed. Kept as a
 * string rather than a `Date`: a birthday is a calendar day, and turning it
 * into an instant invents a timezone it never had.
 */
export const jalaliDateSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[-.]/g, '/'))
  .refine(isValidJalaliDate, { message: 'تاریخ تولد معتبر نیست' });

/** Whole years between a Jalali birthday and an instant. */
export function ageInYears(jalaliBirthDate: string, now: Date): number {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(jalaliBirthDate);
  if (!match) return 0;

  const [year, month, day] = jalaliToGregorian(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
  const born = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (today < born) return 0;

  let years = now.getUTCFullYear() - year;
  const hadBirthday =
    now.getUTCMonth() + 1 > month || (now.getUTCMonth() + 1 === month && now.getUTCDate() >= day);
  if (!hadBirthday) years -= 1;

  return Math.max(0, years);
}
