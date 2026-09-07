/**
 * Passwordless authentication contracts.
 *
 * Iranian e-commerce authenticates by mobile number and a one-time password;
 * there is no password to store, hash or leak. What the schemas here must
 * guarantee is that the *server* decides everything of consequence.
 *
 * Note what is deliberately absent from these request bodies: no user id, no
 * role, no session lifetime, no "verified" flag. Those are server state. A
 * client that sends them is sending noise, and strict parsing rejects it
 * (rules 6, 7 and 8).
 */
import { z } from 'zod';

import { iranianMobileSchema, otpCodeSchema } from './primitives.js';

/** Step one: ask for a code. */
export const requestOtpSchema = z.strictObject({
  mobile: iranianMobileSchema,
});

export type RequestOtpInput = z.output<typeof requestOtpSchema>;

/**
 * Response to an OTP request.
 *
 * Deliberately identical whether or not an account exists for that number.
 * Revealing which numbers are registered turns the login form into an account
 * enumeration oracle.
 */
export const requestOtpResultSchema = z.object({
  /** Seconds until another code may be requested. Drives the resend timer. */
  retryAfterSeconds: z.int().min(0),
  /** Seconds until the issued code stops being accepted. */
  expiresInSeconds: z.int().min(0),
  /** Length of the code to render the OTP input. */
  codeLength: z.int().min(4).max(8),
});

export type RequestOtpResult = z.output<typeof requestOtpResultSchema>;

/** Step two: exchange the code for a session. */
export const verifyOtpSchema = z.strictObject({
  mobile: iranianMobileSchema,
  code: otpCodeSchema,
});

export type VerifyOtpInput = z.output<typeof verifyOtpSchema>;

/**
 * What the client learns after a successful verification.
 *
 * No token appears here. The session lives in an HttpOnly, Secure, SameSite
 * cookie that JavaScript cannot read, so there is nothing for an XSS payload
 * to exfiltrate (rule 7).
 */
export const sessionUserSchema = z.object({
  id: z.uuid(),
  mobile: z.string(),
  displayName: z.string().nullable(),
  /** True once the KYC details required for installment purchase are on file. */
  isKycComplete: z.boolean(),
});

export type SessionUser = z.output<typeof sessionUserSchema>;

export const verifyOtpResultSchema = z.object({
  user: sessionUserSchema,
  /** True when this verification created the account rather than signing in. */
  isNewAccount: z.boolean(),
});

export type VerifyOtpResult = z.output<typeof verifyOtpResultSchema>;

/** The current session, or null. Used to hydrate the client on load. */
export const currentSessionSchema = z.object({
  user: sessionUserSchema.nullable(),
});

export type CurrentSession = z.output<typeof currentSessionSchema>;
