import { Controller, Get } from '@nestjs/common';

/**
 * Liveness endpoint.
 *
 * Deliberately says nothing about versions, dependencies or internals: it is
 * reachable without authentication, so it must not become a reconnaissance
 * surface. Dependency checks belong on a separate, protected readiness route.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { ok: true; data: { status: 'ok' } } {
    return { ok: true, data: { status: 'ok' } };
  }
}
