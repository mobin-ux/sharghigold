# API (NestJS)

Global prefix `api/v1`. Serves only `/health` so far; catalogue and admin
controllers are open work (ADR 0010).

- `src/main.ts`, `app.module.ts`: bootstrap, helmet, global filter.
- `src/common/`: `AppError` + helpers (`forbidden()`, `unauthenticated()`…),
  the error envelope, the request-id middleware. Throw `AppError`; never let a
  raw error or stack reach a response.
- `src/config/env.ts`: every environment variable, parsed with Zod at boot.
- `src/admin/`: `AdminPermissionsGuard` fails closed. Every admin handler
  declares `@RequirePermissions(...)` or `@PublicEndpoint()`. Permissions come
  from `@sharghigold/contracts` `ADMIN_PERMISSIONS`; never invent strings.

Nest resolves constructor injection from emitted metadata: a class used as an
injected type must be a **value** import, not `import type`.

Tests: `pnpm --filter @sharghigold/api test`.
