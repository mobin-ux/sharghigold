/**
 * The single exit point for every error leaving the API.
 *
 * Registered globally so no controller can accidentally return a different
 * error shape, and so nothing escapes the redaction in `translateError`.
 */
import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

import { translateError } from './error-response.js';
import { readRequestId } from './request-id.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const requestId = readRequestId(request.headers['x-request-id']);
    const { status, body, logDetail } = translateError(exception, requestId);

    // 5xx is our fault and gets a stack; 4xx is expected traffic and does not.
    const summary = `${request.method} ${request.url} -> ${String(status)}`;
    if (status >= 500) {
      this.logger.error({ requestId, summary, ...logDetail });
    } else {
      this.logger.warn({ requestId, summary, code: logDetail['code'] });
    }

    response.status(status).json(body);
  }
}
