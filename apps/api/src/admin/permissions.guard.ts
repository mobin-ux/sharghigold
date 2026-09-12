/**
 * The authorisation decision for every administrative endpoint.
 *
 * One guard, applied by a decorator that names the permissions a handler
 * needs. The alternative — each controller checking for itself — is how one
 * endpoint ends up checking `order.read` where it meant `order.refund`, and
 * how a new endpoint ends up checking nothing at all.
 *
 * Four rules it holds to.
 *
 * **A handler with no declared permission is refused, not allowed.** Forgetting
 * the decorator is the likeliest mistake anybody will make here, and it must
 * fail closed. A genuinely public endpoint says so with `@PublicEndpoint()`.
 *
 * **Every permission named must be held**, not any of them. «Read the order
 * and refund it» is one action needing both.
 *
 * **Unauthenticated and forbidden are different answers.** 401 means «tell me
 * who you are»; 403 means «I know who you are, and no». Collapsing them makes
 * a signed-in administrator retry their password against a permission problem.
 *
 * **A deactivated account holds nothing.** That rule lives in `can()` in the
 * shared contract rather than here, so the panel greys out the same controls
 * the API refuses — and so there is one place to read it.
 */
import { Injectable, Inject, type CanActivate, type ExecutionContext } from '@nestjs/common';
// A value import, not a type import: Nest resolves this constructor parameter
// from the `design:paramtypes` metadata the decorator emits, and a type-only
// import erases to `Object` — which fails at runtime, not at build time.
// eslint-disable-next-line typescript/consistent-type-imports
import { Reflector } from '@nestjs/core';
import { can, type AdminPermission } from '@sharghigold/contracts';

import { forbidden, unauthenticated } from '../common/app-error.js';

import {
  ADMIN_ACTOR_KEY,
  ADMIN_DIRECTORY,
  type AdminActor,
  type AdminDirectory,
} from './admin-actor.js';
import { PERMISSIONS_KEY, PUBLIC_KEY } from './require-permissions.decorator.js';

/** The header an administrative credential arrives in. */
const AUTHORIZATION = 'authorization';
const BEARER = 'bearer ';

/**
 * Pull the credential out of an Authorization header.
 *
 * Returns undefined for anything that is not a bearer token, rather than
 * passing the raw header on: a directory that receives `Basic …` and tries to
 * make sense of it is a directory with a second authentication scheme nobody
 * decided to support.
 */
export function readBearer(header: unknown): string | undefined {
  if (typeof header !== 'string') return undefined;
  if (!header.toLowerCase().startsWith(BEARER)) return undefined;

  const credential = header.slice(BEARER.length).trim();
  return credential === '' ? undefined : credential;
}

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ADMIN_DIRECTORY) private readonly directory: AdminDirectory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const target = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, target) === true) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<readonly AdminPermission[]>(
      PERMISSIONS_KEY,
      target,
    );

    // Fail closed. An endpoint under this guard with nothing declared is a
    // programming mistake, and the safe reading of a mistake is «no».
    if (required === undefined || required.length === 0) {
      throw forbidden();
    }

    const request = context.switchToHttp().getRequest<{
      readonly headers: Record<string, unknown>;
      [ADMIN_ACTOR_KEY]?: AdminActor;
    }>();

    const actor = await this.directory.resolve(readBearer(request.headers[AUTHORIZATION]));

    if (actor === undefined) throw unauthenticated();

    // Every one, not any. And `can()` is what knows that a deactivated
    // account holds none of them.
    if (!required.every((permission) => can(actor, permission))) {
      throw forbidden();
    }

    // Handed to the handler so it does not resolve the actor a second time —
    // and so an audit entry can name who did the thing.
    request[ADMIN_ACTOR_KEY] = actor;
    return true;
  }
}
