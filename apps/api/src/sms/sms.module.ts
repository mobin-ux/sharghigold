/**
 * Wiring for the SMS transport.
 *
 * The one decision in this file is which gateway is behind `SMS_GATEWAY`, and
 * it is made once, from validated configuration, at startup. Callers inject
 * `SmsService` and never learn the answer — which is what keeps «swap the
 * panel» a configuration change rather than a refactor.
 *
 * `forRoot` takes the environment rather than reading `process.env`, so a test
 * can build the module against any configuration without setting variables on
 * the process and hoping nothing else in the suite is looking at them.
 */
import { Module, type DynamicModule } from '@nestjs/common';

import type { Env } from '../config/env.js';

import { LogGateway } from './log.gateway.js';
import { SmsWebserviceGateway } from './sms-webservice.gateway.js';
import { SMS_GATEWAY, type SmsGateway } from './sms.port.js';
import { SmsService, SMS_SERVICE_CONFIG, type SmsServiceConfig } from './sms.service.js';

export function gatewayFor(env: Env): SmsGateway {
  if (env.SMS_PROVIDER === 'log') return new LogGateway();

  // `env.SMS_SENDER` is required alongside a real provider, and `loadEnv`
  // refuses to boot without it — so this is a fallback that cannot be reached,
  // not a default anybody relies on.
  return new SmsWebserviceGateway({
    baseUrl: env.SMS_BASE_URL.replace(/\/+$/u, ''),
    apiKey: env.SMS_API_KEY,
    sender: env.SMS_SENDER ?? '',
    timeoutMs: env.SMS_TIMEOUT_MS,
  });
}

@Module({})
export class SmsModule {
  static forRoot(env: Env): DynamicModule {
    const config: SmsServiceConfig = { otpTemplateKey: env.SMS_OTP_TEMPLATE_KEY };

    return {
      module: SmsModule,
      providers: [
        { provide: SMS_GATEWAY, useValue: gatewayFor(env) },
        { provide: SMS_SERVICE_CONFIG, useValue: config },
        SmsService,
      ],
      exports: [SmsService, SMS_GATEWAY],
    };
  }
}
