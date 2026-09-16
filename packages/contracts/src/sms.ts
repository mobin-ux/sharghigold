/**
 * Sending SMS: the vocabulary, not the provider.
 *
 * Nothing here names sms-webservice.com, and that is the point. The panel this
 * shop starts on is one of a dozen Iranian resellers, all of which go down,
 * change their price, or lose a service line; the adapter that speaks to one of
 * them is replaceable exactly to the extent that the rest of the system was
 * never written against its wire format. So the API maps the provider's codes
 * onto the names below at the boundary, and the admin panel, the audit log and
 * every retry decision are written in these names instead.
 *
 * Two distinctions carry real weight and are easy to collapse by accident:
 *
 * **`undelivered` is not `rejected`.** A handset that was switched off may get
 * the message on the next attempt. A number on a blocklist never will. Sending
 * again is right in the first case and is both a waste of credit and a
 * complaint to the regulator in the second.
 *
 * **`failed` is not `rejected` either.** `failed` is the system's fault — a
 * quota, an outage — and belongs in an alert. `rejected` is about the recipient
 * and belongs in the customer's record.
 */
import { z } from 'zod';

import { iranianMobileSchema } from './primitives.js';

/* -------------------------------------------------------------------------- */
/* Why a message is being sent                                                */
/* -------------------------------------------------------------------------- */

/**
 * The purpose of a message, which decides what may be sent and over which line.
 *
 * This is not a label for reporting. Iranian operators treat an unsolicited
 * message and a login code as different products on different lines, and a
 * recipient who has opted out of advertising has opted out of `marketing` only
 * — silently dropping their one-time code because they unsubscribed from a
 * newsletter would lock them out of their own account.
 */
export const SMS_PURPOSES = ['otp', 'transactional', 'marketing'] as const;

export const smsPurposeSchema = z.enum(SMS_PURPOSES);
export type SmsPurpose = z.output<typeof smsPurposeSchema>;

/** Purposes a customer may switch off. `otp` is deliberately absent. */
export const OPTIONAL_SMS_PURPOSES: readonly SmsPurpose[] = ['marketing'];

export function isOptionalPurpose(purpose: SmsPurpose): boolean {
  return OPTIONAL_SMS_PURPOSES.includes(purpose);
}

/* -------------------------------------------------------------------------- */
/* What happened to it                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Where a message has got to.
 *
 * Ordered roughly by progress, but never compared by index: a provider is free
 * to report `delivered` before we have seen `sent`, and code that assumes
 * monotonic progress will drop the delivery receipt when it does.
 */
export const SMS_DELIVERY_STATUSES = [
  /** Accepted by us, not yet handed to the operator. */
  'queued',
  /** With the operator, no receipt yet. */
  'sent',
  /** The handset acknowledged it. */
  'delivered',
  /** The operator tried and the handset did not take it. May succeed later. */
  'undelivered',
  /** The recipient will not receive it: blocked, blocklisted, opted out. */
  'rejected',
  /** The operator gave up before delivering. */
  'expired',
  /** Our side broke: quota, provider error, outage. */
  'failed',
  /** The provider has no answer, or one we do not recognise. */
  'unknown',
] as const;

export const smsDeliveryStatusSchema = z.enum(SMS_DELIVERY_STATUSES);
export type SmsDeliveryStatus = z.output<typeof smsDeliveryStatusSchema>;

/**
 * Statuses that will not change again, so polling can stop.
 *
 * `unknown` is not settled. It is what an unrecognised provider code becomes,
 * and treating it as final would quietly bury a status the provider added
 * after this table was written.
 */
const SETTLED: Readonly<Record<SmsDeliveryStatus, boolean>> = {
  queued: false,
  sent: false,
  delivered: true,
  undelivered: true,
  rejected: true,
  expired: true,
  failed: true,
  unknown: false,
};

export function isSettledStatus(status: SmsDeliveryStatus): boolean {
  return SETTLED[status];
}

/** Worth trying again on a fresh send. Excludes anything about the recipient. */
export function isRetryableStatus(status: SmsDeliveryStatus): boolean {
  return status === 'undelivered' || status === 'expired' || status === 'failed';
}

/* -------------------------------------------------------------------------- */
/* How long a message is                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Characters per segment, by alphabet.
 *
 * Persian is outside GSM 03.38, so every message this shop sends is UCS-2 and
 * fits seventy characters — not the hundred and sixty people expect. A
 * concatenated message loses a further three to the part header.
 */
export const SMS_SEGMENT_GSM = 160;
export const SMS_SEGMENT_GSM_MULTIPART = 153;
export const SMS_SEGMENT_UNICODE = 70;
export const SMS_SEGMENT_UNICODE_MULTIPART = 67;

/** A hard ceiling on a single send, so a runaway template cannot bill for it. */
export const SMS_TEXT_MAX = 1_000;

/**
 * The GSM 03.38 basic set and its extension characters.
 *
 * Built from an explicit list rather than written as a character class, because
 * the set contains `-`, `^`, `]` and `\`, and every one of them changes meaning
 * inside a class depending on where it lands.
 */
const GSM_CHARACTERS = new Set([
  ...'@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?',
  ...'¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
  // Extension characters. They cost two septets each, which `smsSegments`
  // ignores: over-counting a segment is a rounding error, and this shop's
  // messages are Persian and never take this path at all.
  ...'^{}\\[~]|€',
]);

/** True when every character survives the 7-bit alphabet. */
export function isGsmText(text: string): boolean {
  for (const character of text) {
    if (!GSM_CHARACTERS.has(character)) return false;
  }
  return true;
}

/**
 * How many segments the operator will bill for.
 *
 * Counted in code points rather than UTF-16 units: an emoji is one character to
 * the sender and two to `String.length`, and billing follows the operator.
 */
export function smsSegments(text: string): number {
  const length = [...text].length;
  if (length === 0) return 0;

  const gsm = isGsmText(text);
  const single = gsm ? SMS_SEGMENT_GSM : SMS_SEGMENT_UNICODE;
  if (length <= single) return 1;

  const multipart = gsm ? SMS_SEGMENT_GSM_MULTIPART : SMS_SEGMENT_UNICODE_MULTIPART;
  return Math.ceil(length / multipart);
}

/* -------------------------------------------------------------------------- */
/* The record of a send                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A provider's identifier for one message.
 *
 * A string, although every Iranian panel calls it a `long`. It is an opaque
 * handle we only ever echo back when asking after delivery, and holding it as a
 * number puts it one `JSON.parse` away from silent corruption above 2^53 — the
 * same reason money never crosses as a number in this codebase.
 */
export const smsMessageIdSchema = z.string().regex(/^\d{1,20}$/u, {
  message: 'شناسه پیامک معتبر نیست',
});

/**
 * Our own reference, sent with the message and returned with the receipt.
 *
 * It lets a delivery report be matched to the dispatch that caused it without
 * trusting the provider to have kept our row id. The provider types it as a
 * `long`, so it is digits rather than a uuid.
 */
export const smsTraceIdSchema = z.string().regex(/^\d{1,19}$/u, {
  message: 'شناسه پیگیری معتبر نیست',
});

/**
 * One message, as the admin panel lists it.
 *
 * `text` is absent for `otp` on purpose, and the type says so rather than
 * leaving it to whoever writes the query: a code that is still live must not be
 * readable by staff, and a log of one-time passwords is a log worth stealing.
 */
export const smsDispatchSchema = z.object({
  id: z.uuid(),
  purpose: smsPurposeSchema,
  /** Never the full number. See `maskIranianMobile`. */
  maskedMobile: z.string(),
  status: smsDeliveryStatusSchema,
  /** Absent until the provider has accepted the message. */
  providerMessageId: smsMessageIdSchema.nullable(),
  traceId: smsTraceIdSchema,
  /** Billable parts, as counted at send time. */
  segments: z.int().min(0),
  /** Withheld for one-time codes. */
  text: z.string().max(SMS_TEXT_MAX).nullable(),
  createdAt: z.iso.datetime(),
  settledAt: z.iso.datetime().nullable(),
});

export type SmsDispatch = z.output<typeof smsDispatchSchema>;

/**
 * Why a send was refused.
 *
 * A closed set, never the provider's own sentence. The upstream text is written
 * for whoever bought the panel rather than for a customer, and has been
 * observed to quote the account's own details back.
 */
export const SMS_SEND_FAILURES = [
  /** The panel rejected our credentials or our address. Our fault, not the user's. */
  'provider-rejected',
  /** Out of credit, or past the daily cap. */
  'quota-exhausted',
  /** Not a number this provider will send to. */
  'invalid-recipient',
  /** The recipient asked not to receive this kind of message. */
  'opted-out',
  /** The provider could not be reached, or did not answer in time. */
  'unreachable',
] as const;

export const smsSendFailureSchema = z.enum(SMS_SEND_FAILURES);
export type SmsSendFailure = z.output<typeof smsSendFailureSchema>;

export const smsSendResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('accepted'),
    providerMessageId: smsMessageIdSchema,
    traceId: smsTraceIdSchema,
    segments: z.int().min(0),
  }),
  z.object({
    status: z.literal('refused'),
    reason: smsSendFailureSchema,
    /** True when sending the very same message again could work. */
    retryable: z.boolean(),
  }),
]);

export type SmsSendResult = z.output<typeof smsSendResultSchema>;

/* -------------------------------------------------------------------------- */
/* Asking for one to be sent                                                  */
/* -------------------------------------------------------------------------- */

/**
 * An operator-initiated send, from the admin panel.
 *
 * `purpose` is here and the sending line is not. Which line carries a message
 * follows from its purpose and from what the panel has approved today, and that
 * is a decision the server makes — a request that chose its own line could put
 * an advertisement down the one reserved for login codes and cost the shop the
 * line.
 *
 * `otp` is excluded: a one-time code is issued by the login flow, which owns
 * the code, its lifetime and its rate limit. An endpoint that sent one on
 * request would be a way to make somebody's phone ring at will.
 */
export const smsSendRequestSchema = z.strictObject({
  mobile: iranianMobileSchema,
  purpose: smsPurposeSchema.exclude(['otp']),
  text: z.string().trim().min(1).max(SMS_TEXT_MAX),
});

export type SmsSendRequest = z.output<typeof smsSendRequestSchema>;

/** Asking after messages already sent, by our reference or the provider's. */
export const smsStatusQuerySchema = z
  .strictObject({
    messageIds: z.array(smsMessageIdSchema).min(1).max(100).optional(),
    traceIds: z.array(smsTraceIdSchema).min(1).max(100).optional(),
  })
  .refine((query) => (query.messageIds === undefined) !== (query.traceIds === undefined), {
    message: 'یکی از شناسه‌های پیامک یا پیگیری را بفرستید، نه هر دو',
  });

export type SmsStatusQuery = z.output<typeof smsStatusQuerySchema>;

export const smsStatusReportSchema = z.object({
  providerMessageId: smsMessageIdSchema.nullable(),
  traceId: smsTraceIdSchema.nullable(),
  status: smsDeliveryStatusSchema,
  /** The provider's own code, kept for support. Not branched on. */
  providerStatusCode: z.int().nullable(),
});

export type SmsStatusReport = z.output<typeof smsStatusReportSchema>;

/**
 * What the panel has left.
 *
 * `credit` is the provider's own unit — a message count for some resellers, a
 * rial balance for others — so it is reported, never spent against. It exists
 * so the admin panel can raise an alarm before a login code fails to send.
 */
export const smsAccountInfoSchema = z.object({
  credit: z.string(),
  availableSenders: z.array(z.string()),
});

export type SmsAccountInfo = z.output<typeof smsAccountInfoSchema>;
