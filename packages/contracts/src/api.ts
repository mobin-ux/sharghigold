/**
 * The shape of every API response, and the vocabulary of errors.
 *
 * One envelope for every endpoint means the storefront has exactly one place
 * that understands success and failure. It also keeps rule 20 enforceable: the
 * client is only ever handed a stable `code` and a message safe to display,
 * never a stack trace, a driver error or an internal path.
 */
import { z } from 'zod';

/**
 * Machine-readable error codes.
 *
 * The client switches on these, never on message text — messages are Persian
 * copy and will be rewritten by people who are not thinking about branching
 * logic when they do it.
 */
export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'PRICE_QUOTE_EXPIRED',
  'PRICE_UNAVAILABLE',
  'OUT_OF_STOCK',
  'PAYMENT_FAILED',
  'INTERNAL_ERROR',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.output<typeof apiErrorCodeSchema>;

/** HTTP status for each code, so controllers cannot map them inconsistently. */
export const API_ERROR_STATUS: Readonly<Record<ApiErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  OTP_INVALID: 400,
  OTP_EXPIRED: 410,
  PRICE_QUOTE_EXPIRED: 409,
  PRICE_UNAVAILABLE: 503,
  OUT_OF_STOCK: 409,
  PAYMENT_FAILED: 402,
  INTERNAL_ERROR: 500,
};

/** A single field-level validation problem, addressed by dotted path. */
export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export type FieldError = z.output<typeof fieldErrorSchema>;

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  /** Safe to display to the user. Persian. */
  message: z.string(),
  /** Present only for VALIDATION_FAILED. */
  fields: z.array(fieldErrorSchema).optional(),
  /**
   * Correlates this response with the server log entry. Carries no detail by
   * itself, so it is safe to show in a support conversation.
   */
  requestId: z.string().optional(),
});

export type ApiError = z.output<typeof apiErrorSchema>;

export const apiFailureSchema = z.object({
  ok: z.literal(false),
  error: apiErrorSchema,
});

export function apiSuccessSchema<T extends z.ZodType>(data: T) {
  return z.object({
    ok: z.literal(true),
    data,
  });
}

export function apiResponseSchema<T extends z.ZodType>(data: T) {
  return z.union([apiSuccessSchema(data), apiFailureSchema]);
}

export type ApiSuccess<T> = { readonly ok: true; readonly data: T };
export type ApiFailure = { readonly ok: false; readonly error: ApiError };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
