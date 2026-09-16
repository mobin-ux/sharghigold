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
- `src/sms/`: the SMS transport. Inject `SmsService`; never the gateway.
  `sms-webservice.gateway.ts` is the only file that knows the vendor.
  Rules it keeps, all load-bearing: POST only with the `ApiKey` in the body
  (the vendor's GET forms put the key — and a login code — in a URL), https
  only, **a send is never retried** (the acknowledgement is the only evidence
  it was accepted), and `FinalText` is dropped on arrival because it contains
  the code. `AppModule.forRoot(env)` passes the parsed environment down; no
  module reads `process.env` for itself.

`SMS_PROVIDER=log` writes messages to the log and sends nothing; `loadEnv`
refuses to boot production with it, and refuses production without
`SMS_OTP_TEMPLATE_KEY`.

Nest resolves constructor injection from emitted metadata: a class used as an
injected type must be a **value** import, not `import type`.

Tests: `pnpm --filter @sharghigold/api test`.
