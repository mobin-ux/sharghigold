/**
 * API entry point.
 *
 * Everything security-relevant is configured here, once, so that it cannot be
 * forgotten per-route: security headers, an explicit CORS allowlist, a body
 * size cap, the global error filter, and graceful shutdown.
 */
import 'reflect-metadata';

import { Logger, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { translateError } from './common/error-response.js';
import { readRequestId } from './common/request-id.js';
import { loadEnv } from './config/env.js';

/** Requests larger than this are refused before any parsing work happens. */
const MAX_BODY_SIZE = '256kb';

export const API_PREFIX = 'api/v1';

async function bootstrap(): Promise<void> {
  // Fail fast and loudly on bad configuration, before a port is opened.
  const env = loadEnv();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // The default 'error' body-parser behaviour is replaced below.
    bodyParser: false,
  });

  const { json, urlencoded } = await import('express');
  app.use(json({ limit: MAX_BODY_SIZE }));
  app.use(urlencoded({ extended: false, limit: MAX_BODY_SIZE }));

  app.use(
    helmet({
      // This process serves JSON, never HTML, so the least-privilege policy is
      // to forbid everything. The storefront sets its own, looser policy.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
        },
      },
      // Enabled only in production: sending HSTS over plain http during local
      // development pins the browser to https for localhost.
      hsts:
        env.NODE_ENV === 'production'
          ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
          : false,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // An API response is per-user and must never be reused by a shared cache.
  app.use(
    (
      _request: unknown,
      response: { setHeader: (k: string, v: string) => void },
      next: () => void,
    ) => {
      response.setHeader('Cache-Control', 'no-store');
      next();
    },
  );

  app.enableCors({
    origin: env.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id', 'X-CSRF-Token'],
    maxAge: 600,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  // Do not advertise the server implementation.
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Routes are registered during init. Anything registered afterwards runs only
  // when no route matched, which is the only way to catch unmatched requests:
  // they never enter the Nest pipeline, so the global exception filter cannot
  // see them. Without this, Express answers with its default HTML error page
  // and echoes the requested path back.
  await app.init();
  app.use((request: Request, response: Response) => {
    const requestId = readRequestId(request.headers['x-request-id']);
    const { status, body } = translateError(new NotFoundException(), requestId);
    response.status(status).json(body);
  });

  await app.listen(env.API_PORT, env.API_BIND_HOST);
  logger.log(`API listening on ${env.API_BIND_HOST}:${String(env.API_PORT)} (${env.NODE_ENV})`);
}

bootstrap().catch((error: unknown) => {
  // Configuration and startup failures are fatal by design: a half-configured
  // API is more dangerous than one that is down.
  const logger = new Logger('Bootstrap');
  logger.error(error instanceof Error ? error.message : String(error));
  // exit(), not exitCode: the failure may have happened after the HTTP server
  // or a database pool was already listening, and those handles keep the event
  // loop alive. Setting exitCode alone would leave a half-started process up
  // and apparently healthy to any supervisor watching for the process to die.
  process.exit(1);
});
