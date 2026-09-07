/**
 * Translation from a thrown value into the wire error envelope.
 *
 * Kept as a pure function, separate from the Nest exception filter, for two
 * reasons: it is the security-critical half (it decides what a client is
 * allowed to learn), and it can be unit-tested without Nest.
 *
 * The rule it enforces: anything not deliberately thrown as an `AppError`
 * becomes a generic INTERNAL_ERROR. An unexpected failure must never leak a
 * stack trace, a driver message, a SQL fragment or a filesystem path to the
 * client (rule 20).
 */
import { HttpException } from '@nestjs/common';
import { API_ERROR_STATUS, type ApiError, type ApiFailure } from '@sharghigold/contracts';
import { ZodError } from 'zod';

import { AppError } from './app-error.js';

const GENERIC_MESSAGE = 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید';

export interface ErrorTranslation {
  readonly status: number;
  readonly body: ApiFailure;
  /** Everything worth logging that must not be sent to the client. */
  readonly logDetail: Readonly<Record<string, unknown>>;
}

export function translateError(error: unknown, requestId: string): ErrorTranslation {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: failure({
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: [...error.fields] } : {}),
        requestId,
      }),
      logDetail: { code: error.code, ...(error.context ?? {}) },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: API_ERROR_STATUS.VALIDATION_FAILED,
      body: failure({
        code: 'VALIDATION_FAILED',
        message: 'اطلاعات ارسالی معتبر نیست',
        fields: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
        requestId,
      }),
      logDetail: { code: 'VALIDATION_FAILED', issueCount: error.issues.length },
    };
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    // Nest raises these for routing-level conditions such as 404 and 405. Map
    // the ones with a contract code; treat anything else as internal so that a
    // framework message never becomes customer-facing copy.
    if (status === API_ERROR_STATUS.NOT_FOUND) {
      return {
        status,
        body: failure({ code: 'NOT_FOUND', message: 'موردی یافت نشد', requestId }),
        logDetail: { code: 'NOT_FOUND' },
      };
    }
    if (status === API_ERROR_STATUS.RATE_LIMITED) {
      return {
        status,
        body: failure({
          code: 'RATE_LIMITED',
          message: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید',
          requestId,
        }),
        logDetail: { code: 'RATE_LIMITED' },
      };
    }
  }

  return {
    status: API_ERROR_STATUS.INTERNAL_ERROR,
    body: failure({ code: 'INTERNAL_ERROR', message: GENERIC_MESSAGE, requestId }),
    logDetail: {
      code: 'INTERNAL_ERROR',
      // Recorded for the operator, not the customer.
      thrown: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
}

function failure(error: ApiError): ApiFailure {
  return { ok: false, error };
}
