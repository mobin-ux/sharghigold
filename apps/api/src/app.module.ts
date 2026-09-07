import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module.js';

/**
 * Composition root.
 *
 * Feature modules are added here as they arrive. Business logic never lives in
 * this file; it only wires modules together.
 */
@Module({ imports: [HealthModule] })
export class AppModule {}
