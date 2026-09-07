/**
 * The one error type the application throws deliberately.
 *
 * An `AppError` carries a code from the shared contract vocabulary, a message
 * that is safe to show a customer, and optionally some internal context that is
 * logged but never serialised to the client (rule 20).
 */
import { API_ERROR_STATUS, type ApiErrorCode, type FieldError } from '@sharghigold/contracts';

export class AppError extends Error {
  override readonly name = 'AppError';

  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fields: readonly FieldError[] | undefined;

  /**
   * Detail for the log only. Never reaches the response body, so it is safe to
   * put identifiers, query context or upstream failure text here.
   */
  readonly context: Readonly<Record<string, unknown>> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      readonly fields?: readonly FieldError[];
      readonly context?: Readonly<Record<string, unknown>>;
      readonly cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.code = code;
    this.status = API_ERROR_STATUS[code];
    this.fields = options.fields;
    this.context = options.context;
  }
}

export const notFound = (message = 'موردی یافت نشد'): AppError =>
  new AppError('NOT_FOUND', message);

export const unauthenticated = (message = 'برای ادامه وارد حساب خود شوید'): AppError =>
  new AppError('UNAUTHENTICATED', message);

export const forbidden = (message = 'اجازه دسترسی به این بخش را ندارید'): AppError =>
  new AppError('FORBIDDEN', message);
