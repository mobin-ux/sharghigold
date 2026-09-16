/**
 * The provider's two numeric tables, and what they mean to us.
 *
 * sms-webservice.com answers with an `ErrorCode` when it refuses a request and
 * a `StatusCode` when asked what became of a message. Both are small integers
 * documented only in Persian prose on a help page, so they are written out here
 * once — with the vendor's own wording kept beside each entry, because the day
 * somebody is reading this is the day an operator is on the phone quoting that
 * exact sentence.
 *
 * These tables are protocol, not policy. They are hard-coded deliberately: they
 * describe a wire format that changes when the vendor publishes a new document,
 * not a business rule that changes when the shop decides something. Nothing in
 * `config/` belongs here and nothing here belongs in `config/`.
 *
 * Both lookups are total. An integer the vendor has started returning and this
 * file has not heard of maps to the most cautious answer available rather than
 * to `undefined`, because the alternative is a crash in the branch that handles
 * failure — which is the branch least likely to have been exercised.
 */
import type { SmsDeliveryStatus, SmsSendFailure } from '@sharghigold/contracts';

/* -------------------------------------------------------------------------- */
/* Why a request was refused                                                  */
/* -------------------------------------------------------------------------- */

interface ProviderError {
  /** The vendor's own description, for the log and for support. */
  readonly note: string;
  readonly reason: SmsSendFailure;
  /** True when the identical request could succeed later, untouched. */
  readonly retryable: boolean;
}

/**
 * `ErrorCode` values, from the vendor's error list.
 *
 * Almost all of them are configuration faults on our side of the account —
 * a wrong key, an unverified panel, an address that is not allow-listed — and
 * they are `provider-rejected` rather than anything the customer did. Retrying
 * those is pointless and the flag says so; the two marked «temporarily» in the
 * vendor's own wording are the exceptions, and so is the daily cap, which
 * clears at midnight.
 */
const PROVIDER_ERRORS = new Map<number, ProviderError>([
  [1, { note: 'ApiKey نادرست است', reason: 'provider-rejected', retryable: false }],
  [
    2,
    {
      note: 'ارسال از وبسرویس برای این کاربر فعال نشده است',
      reason: 'provider-rejected',
      retryable: false,
    },
  ],
  [3, { note: 'کاربر فعال نیست', reason: 'provider-rejected', retryable: false }],
  [
    4,
    {
      note: 'ارسال از طریق Api موقتا غیر فعال است',
      reason: 'provider-rejected',
      retryable: true,
    },
  ],
  [
    5,
    {
      note: 'ارسال از طریق این متد موقتا غیر فعال است',
      reason: 'provider-rejected',
      retryable: true,
    },
  ],
  [
    6,
    {
      note: 'تلفن همراه ثبت شده روی این اکانت تائید نشده است',
      reason: 'provider-rejected',
      retryable: false,
    },
  ],
  [
    7,
    {
      note: 'ایمیل ثبت شده روی این اکانت تائید نشده است',
      reason: 'provider-rejected',
      retryable: false,
    },
  ],
  [
    8,
    {
      note: 'اطلاعات هویتی کاربر به صورت کامل درج نشده است',
      reason: 'provider-rejected',
      retryable: false,
    },
  ],
  // Our bug, not theirs: a malformed body. Retrying sends the same bad body.
  [9, { note: 'مقادیر ورودی نادرست است', reason: 'provider-rejected', retryable: false }],
  [
    10,
    {
      note: 'آی پی درخواست دهنده در لیست آی پی های معتبر نیست',
      reason: 'provider-rejected',
      retryable: false,
    },
  ],
  [11, { note: 'فرمت ورودی ApiKey نادرست است', reason: 'provider-rejected', retryable: false }],
  [12, { note: 'شماره ارسال کننده نادرست است', reason: 'provider-rejected', retryable: false }],
  // The one error that is genuinely about the number we were handed.
  [
    13,
    {
      note: 'شماره دریافت کننده باید با ۹ یا ۹۸۹ شروع شود',
      reason: 'invalid-recipient',
      retryable: false,
    },
  ],
  [14, { note: 'شما به این متد دسترسی ندارید', reason: 'provider-rejected', retryable: false }],
  // Clears at midnight, so the same message is worth sending again tomorrow.
  [15, { note: 'سقف ارسال روزانه به پایان رسید', reason: 'quota-exhausted', retryable: true }],
]);

/**
 * What an unrecognised `ErrorCode` becomes.
 *
 * The vendor's OpenAPI document enumerates codes up to 20 and a code 100 that
 * its own help page never describes, so this path is reachable today and not
 * merely defensive. `retryable: false` is the safe side of the guess: a send
 * retried in a loop against an error we do not understand is how an account
 * spends its credit overnight.
 */
const UNKNOWN_ERROR: ProviderError = {
  note: 'خطای ناشناخته از سامانه پیامک',
  reason: 'provider-rejected',
  retryable: false,
};

export function describeProviderError(code: number | null | undefined): ProviderError {
  if (code === null || code === undefined) return UNKNOWN_ERROR;
  return PROVIDER_ERRORS.get(code) ?? UNKNOWN_ERROR;
}

/* -------------------------------------------------------------------------- */
/* What became of a message                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `StatusCode` values, from the vendor's delivery-status list.
 *
 * The mapping collapses eighteen vendor codes onto seven of our own, and the
 * collapsing is where the judgement is. Three groups matter:
 *
 *   * **5 «نرسیده به گوشی»** is `undelivered` — the handset was off or out of
 *     coverage. Worth another attempt.
 *   * **7, 11, 12, 13, 14, 15, 16** are all `rejected`. The recipient has
 *     blocked the line, is on a blocklist, sent the stop keyword, or is not a
 *     mobile number at all. None of them improves by sending again, and two of
 *     them are a regulatory complaint if we do.
 *   * **17 «محدودیت روزانه»** is `failed`, not `rejected`: the cap is ours, the
 *     recipient did nothing, and it is an operations alert.
 */
const PROVIDER_STATUSES = new Map<
  number,
  { readonly note: string; readonly status: SmsDeliveryStatus }
>([
  [0, { note: 'در صف سامانه', status: 'queued' }],
  [1, { note: 'ارسال شده، بدون وضعیت', status: 'sent' }],
  [2, { note: 'ارسال شده، در صف اپراتور', status: 'sent' }],
  [3, { note: 'در انتظار تحویل گوشی', status: 'sent' }],
  [4, { note: 'تحویل به گوشی', status: 'delivered' }],
  [5, { note: 'نرسیده به گوشی', status: 'undelivered' }],
  [6, { note: 'خطا در ارسال', status: 'failed' }],
  [7, { note: 'گیرنده دریافت از خطوط تبلیغاتی را بسته است', status: 'rejected' }],
  // Not «no such message»: an id we have just been given can be unknown to
  // the vendor for a few seconds. `unknown` is unsettled, so polling goes on.
  [8, { note: 'شناسه پیدا نشد', status: 'unknown' }],
  [9, { note: 'منقضی', status: 'expired' }],
  [10, { note: 'نامشخص', status: 'unknown' }],
  [11, { note: 'دریافت کننده نامعتبر', status: 'rejected' }],
  [12, { note: 'گیرنده در لیست سیاه اکانت است', status: 'rejected' }],
  [13, { note: 'گیرنده برای اپراتور ارسال کننده نامعتبر است', status: 'rejected' }],
  [14, { note: 'متن بلاک', status: 'rejected' }],
  [15, { note: 'لغو دریافت توسط گیرنده', status: 'rejected' }],
  [16, { note: 'بلاک شده', status: 'rejected' }],
  [17, { note: 'سقف ارسال روزانه api', status: 'failed' }],
]);

const UNKNOWN_STATUS = { note: 'وضعیت ناشناخته از سامانه پیامک', status: 'unknown' } as const;

export function describeProviderStatus(code: number | null | undefined): {
  readonly note: string;
  readonly status: SmsDeliveryStatus;
} {
  if (code === null || code === undefined) return UNKNOWN_STATUS;
  return PROVIDER_STATUSES.get(code) ?? UNKNOWN_STATUS;
}
