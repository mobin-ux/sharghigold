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
  z.string().trim().min(1).max(max).transform(stripControlCharacters);

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
