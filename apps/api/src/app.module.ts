import { Module, type DynamicModule } from '@nestjs/common';

import type { Env } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { SmsModule } from './sms/sms.module.js';

/**
 * Composition root.
 *
 * Feature modules are added here as they arrive. Business logic never lives in
 * this file; it only wires modules together.
 *
 * `forRoot` takes the already-validated environment rather than letting modules
 * reach for `process.env` themselves. One parse, at startup, in `main.ts`: a
 * module that read a variable directly would be a second place for
 * configuration to be wrong, and the one place that would not fail at boot.
 */
@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [HealthModule, SmsModule.forRoot(env)],
    };
  }
}
