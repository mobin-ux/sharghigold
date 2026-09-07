import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { AppError } from '../common/app-error.js';
import { translateError } from '../common/error-response.js';

const REQUEST_ID = 'req-123';

describe('translateError', () => {
  it('passes through a deliberate AppError with its code and message', () => {
    const result = translateError(new AppError('OUT_OF_STOCK', 'موجودی کافی نیست'), REQUEST_ID);

    expect(result.status).toBe(409);
    expect(result.body).toEqual({
      ok: false,
      error: { code: 'OUT_OF_STOCK', message: 'موجودی کافی نیست', requestId: REQUEST_ID },
    });
  });

  it('keeps AppError context out of the response body but in the log', () => {
    const result = translateError(
      new AppError('NOT_FOUND', 'موردی یافت نشد', {
        context: { productId: 'internal-uuid', query: 'SELECT ...' },
      }),
      REQUEST_ID,
    );

    expect(JSON.stringify(result.body)).not.toContain('internal-uuid');
    expect(JSON.stringify(result.body)).not.toContain('SELECT');
    expect(result.logDetail['productId']).toBe('internal-uuid');
  });

  it('turns a ZodError into field-level validation errors', () => {
    const schema = z.object({ mobile: z.string().min(11), code: z.string() });
    const parsed = schema.safeParse({ mobile: '091', code: 42 });
    expect(parsed.success).toBe(false);

    if (parsed.success) return;
    const result = translateError(parsed.error, REQUEST_ID);

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_FAILED');
    expect(result.body.error.fields?.map((field) => field.path)).toContain('mobile');
  });

  describe('unexpected failures', () => {
    it('never leaks the thrown message to the client', () => {
      const leaky = new Error(
        'connect ECONNREFUSED 10.0.0.5:5432 — password authentication failed for user "postgres"',
      );
      const result = translateError(leaky, REQUEST_ID);

      expect(result.status).toBe(500);
      expect(result.body.error.code).toBe('INTERNAL_ERROR');

      const serialised = JSON.stringify(result.body);
      expect(serialised).not.toContain('ECONNREFUSED');
      expect(serialised).not.toContain('10.0.0.5');
      expect(serialised).not.toContain('postgres');
    });

    it('never leaks a stack trace to the client', () => {
      const result = translateError(new Error('boom'), REQUEST_ID);
      expect(JSON.stringify(result.body)).not.toContain('at ');
      // The operator still gets it.
      expect(result.logDetail['stack']).toBeTypeOf('string');
    });

    it('handles a thrown non-Error without crashing', () => {
      const result = translateError('a bare string', REQUEST_ID);
      expect(result.status).toBe(500);
      expect(result.body.error.message).not.toContain('a bare string');
      expect(result.logDetail['thrown']).toBe('a bare string');
    });
  });

  it('maps framework 404s to the contract vocabulary', () => {
    const result = translateError(
      new HttpException('Cannot GET /nope', HttpStatus.NOT_FOUND),
      REQUEST_ID,
    );
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(result.body)).not.toContain('Cannot GET');
  });

  it('treats any other HttpException as internal rather than echoing it', () => {
    const result = translateError(
      new HttpException('Internal framework detail', HttpStatus.BAD_GATEWAY),
      REQUEST_ID,
    );
    expect(result.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(result.body)).not.toContain('framework detail');
  });

  it('always attaches the request id for support correlation', () => {
    expect(translateError(new Error('x'), REQUEST_ID).body.error.requestId).toBe(REQUEST_ID);
  });
});
