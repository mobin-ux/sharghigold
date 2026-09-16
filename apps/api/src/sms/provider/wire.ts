/**
 * The provider's wire format, parsed rather than trusted.
 *
 * These schemas exist for the reason `ports.ts` gives in the storefront: a
 * vendor that has drifted from its documentation and a vendor that was never
 * documented accurately are the same bug, and both are caught here — at the
 * boundary, before anything above it sees a field. The alternative is an
 * `as SendResponse` cast, which is a promise the compiler cannot keep.
 *
 * Everything is deliberately permissive about *absence* and strict about
 * *shape*. The live panel answers a success with `"ErrorCode": null` and an
 * `"Error": null`, which the vendor's own OpenAPI document declares as a
 * non-nullable integer and a non-nullable string. Refusing that response would
 * mean refusing every successful send.
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Numbers that are really identifiers                                        */
/* -------------------------------------------------------------------------- */

/**
 * A vendor `long`, carried into our code as a string.
 *
 * The vendor sends message ids as bare JSON numbers, and `JSON.parse` turns
 * anything above 2^53 into the nearest double without a word. An id corrupted
 * that way still looks like an id — it is the right length and parses fine —
 * and the only symptom is that every later delivery report for that message
 * quietly fails to match. So the range is asserted here and a violation throws,
 * rather than being rounded and passed on.
 *
 * This is the same rule the rest of the codebase applies to money, for the same
 * reason: a silent loss of precision is worse than a loud failure.
 */
const providerLong = z
  .number()
  .refine(Number.isSafeInteger, {
    message: 'provider returned an identifier outside the exactly-representable range',
  })
  .refine((value) => value >= 0, { message: 'provider returned a negative identifier' })
  .transform((value) => String(value));

/** The same, where the vendor may legitimately omit it. */
const optionalProviderLong = providerLong.nullish().transform((value) => value ?? null);

/* -------------------------------------------------------------------------- */
/* The envelope                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Every V3 method answers with this, whatever it was asked.
 *
 * `Error` is parsed so that it can be logged, and is never propagated to a
 * caller: it is vendor copy written for the account holder, and has been
 * observed to quote panel details back. `codes.ts` turns `ErrorCode` into
 * something safe to act on.
 */
export function envelopeSchema<T extends z.ZodType>(result: T) {
  return z.object({
    Success: z.boolean(),
    ErrorCode: z
      .number()
      .int()
      .nullish()
      .transform((value) => value ?? null),
    Error: z
      .string()
      .nullish()
      .transform((value) => value ?? null),
    Result: result.nullish().transform((value) => value ?? null),
  });
}

/* -------------------------------------------------------------------------- */
/* Per-method result shapes                                                   */
/* -------------------------------------------------------------------------- */

/** `Send`, `SendBulk`, `SendMultiple`: one entry per recipient. */
export const sendResultSchema = z.array(
  z.object({
    Id: providerLong,
    UserTraceId: optionalProviderLong,
  }),
);

/**
 * `SendTokenSingle`, `SendTokenMulti`: the same, plus the line used and the
 * text as it went out.
 *
 * `FinalText` is the template with its parameters substituted, which for a
 * login code means `FinalText` *contains the code*. It is parsed because the
 * vendor sends it, and it is dropped immediately — see `sms-webservice.gateway`.
 * It must never be logged, stored or returned.
 */
export const sendTokenResultSchema = z.array(
  z.object({
    Id: providerLong,
    UserTraceId: optionalProviderLong,
    Sender: optionalProviderLong,
    FinalText: z.string().nullish(),
  }),
);

/** `StatusById`, `StatusByUserTraceId`. */
export const statusResultSchema = z.array(
  z.object({
    Id: optionalProviderLong,
    UserTraceId: optionalProviderLong,
    StatusCode: z
      .number()
      .int()
      .nullish()
      .transform((value) => value ?? null),
    /** The vendor's Persian label. Kept for the log only. */
    Status: z.string().nullish(),
  }),
);

/**
 * `AccountInfo`.
 *
 * `Credit` arrives as a JSON double (`1000.00` on the live panel). It is turned
 * into a string at the boundary and never used in arithmetic: it is the
 * vendor's own unit — a message count for some resellers, a rial balance for
 * others — and this system does not spend against it. It exists so the panel
 * can raise an alarm before a login code fails to send.
 */
export const accountInfoResultSchema = z.object({
  Credit: z.number().transform((value) => String(value)),
  AvailableSenders: z
    .array(providerLong)
    .nullish()
    .transform((value) => value ?? []),
});

/** `TokenList`: the approved templates, with the status of each. */
export const tokenListResultSchema = z.array(
  z.object({
    Key: z.string(),
    TextTemplate: z.string().nullish(),
    VoiceTemplate: z.string().nullish(),
    Status: z
      .number()
      .int()
      .nullish()
      .transform((value) => value ?? null),
  }),
);

export type SendResult = z.output<typeof sendResultSchema>;
export type SendTokenResult = z.output<typeof sendTokenResultSchema>;
export type StatusResult = z.output<typeof statusResultSchema>;
export type AccountInfoResult = z.output<typeof accountInfoResultSchema>;
export type TokenListResult = z.output<typeof tokenListResultSchema>;
