/**
 * What goes wrong below the SMS seam.
 *
 * Separate from `AppError` because these are not answers to a customer. An
 * unreachable panel is an operations problem; the customer gets whatever the
 * calling flow decides — usually «try again shortly» — and the detail stays in
 * the log. Letting a vendor's sentence become an HTTP response body is how a
 * panel's own account details end up on a login screen.
 */

/** The provider answered, and said no. */
export class SmsProviderError extends Error {
  override readonly name = 'SmsProviderError';

  /** The vendor's `ErrorCode`, or null when it did not send one. */
  readonly providerCode: number | null;
  /** True when the identical request could succeed later, untouched. */
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { readonly providerCode: number | null; readonly retryable: boolean },
  ) {
    super(message);
    this.providerCode = options.providerCode;
    this.retryable = options.retryable;
  }
}

/** The provider could not be reached, timed out, or answered unintelligibly. */
export class SmsTransportError extends Error {
  override readonly name = 'SmsTransportError';

  constructor(message: string, options: { readonly cause?: unknown } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
  }
}
