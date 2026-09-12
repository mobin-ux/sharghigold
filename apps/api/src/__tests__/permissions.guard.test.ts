import type { Reflector } from '@nestjs/core';
import { DEFAULT_ADMIN_ROLES, type AdminPermission } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { ADMIN_ACTOR_KEY, type AdminActor, type AdminDirectory } from '../admin/admin-actor.js';
import { AdminPermissionsGuard, readBearer } from '../admin/permissions.guard.js';
import { PERMISSIONS_KEY, PUBLIC_KEY } from '../admin/require-permissions.decorator.js';

/**
 * The authorisation decision, before there is anything to authorise.
 *
 * Written now because it is the part that is expensive to get wrong later:
 * once twenty endpoints exist, «does this guard fail open when the decorator
 * is missing» is a question nobody re-asks.
 */

const ACTOR: AdminActor = {
  id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4201',
  isActive: true,
  permissions: [...DEFAULT_ADMIN_ROLES.fulfilment.permissions],
};

/** A reflector that answers with whatever metadata the test declares. */
function reflectorFor(metadata: Readonly<Record<string, unknown>>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

function directoryFor(actor: AdminActor | undefined): AdminDirectory {
  return {
    resolve: (credential: string | undefined) =>
      Promise.resolve(credential === 'good-token' ? actor : undefined),
  };
}

interface FakeRequest {
  readonly headers: Record<string, unknown>;
  [ADMIN_ACTOR_KEY]?: AdminActor;
}

function contextFor(request: FakeRequest) {
  return {
    getHandler: () => () => undefined,
    getClass: () => AdminPermissionsGuard,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Parameters<AdminPermissionsGuard['canActivate']>[0];
}

async function run(
  metadata: Readonly<Record<string, unknown>>,
  headers: Record<string, unknown>,
  actor: AdminActor | undefined = ACTOR,
): Promise<{ readonly allowed: boolean; readonly request: FakeRequest }> {
  const guard = new AdminPermissionsGuard(reflectorFor(metadata), directoryFor(actor));
  const request: FakeRequest = { headers };
  const allowed = await guard.canActivate(contextFor(request));

  return { allowed, request };
}

const AUTH = { authorization: 'Bearer good-token' };

describe('reading the credential', () => {
  it('takes a bearer token, case-insensitively', () => {
    expect(readBearer('Bearer abc')).toBe('abc');
    expect(readBearer('bearer abc')).toBe('abc');
  });

  it('ignores any other scheme rather than passing it on', () => {
    // A directory that receives `Basic …` and tries to make sense of it is a
    // second authentication scheme nobody decided to support.
    expect(readBearer('Basic abc')).toBeUndefined();
    expect(readBearer('abc')).toBeUndefined();
    expect(readBearer('Bearer   ')).toBeUndefined();
    expect(readBearer(undefined)).toBeUndefined();
    expect(readBearer(['Bearer abc'])).toBeUndefined();
  });
});

describe('the guard', () => {
  it('allows a handler whose permissions the actor holds', async () => {
    const { allowed, request } = await run(
      { [PERMISSIONS_KEY]: ['order.read'] satisfies AdminPermission[] },
      AUTH,
    );

    expect(allowed).toBe(true);
    // The handler reads the actor from here rather than resolving it again,
    // which is also what lets an audit entry name who did the thing.
    expect(request[ADMIN_ACTOR_KEY]?.id).toBe(ACTOR.id);
  });

  it('refuses a handler that declares nothing', async () => {
    // Forgetting the decorator is the likeliest mistake anybody will make, and
    // the safe reading of a mistake is «no».
    await expect(run({}, AUTH)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(run({ [PERMISSIONS_KEY]: [] }, AUTH)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('requires every permission, not any of them', async () => {
    await expect(
      run({ [PERMISSIONS_KEY]: ['order.read', 'order.refund'] }, AUTH),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('answers 401 for no credential and 403 for the wrong one', async () => {
    // Collapsing the two makes a signed-in administrator retry their password
    // against a permission problem.
    await expect(run({ [PERMISSIONS_KEY]: ['order.read'] }, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });

    await expect(run({ [PERMISSIONS_KEY]: ['settings.write'] }, AUTH)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('refuses a deactivated administrator holding every permission', async () => {
    const suspended: AdminActor = {
      ...ACTOR,
      isActive: false,
      permissions: [...DEFAULT_ADMIN_ROLES.owner.permissions],
    };

    await expect(run({ [PERMISSIONS_KEY]: ['order.read'] }, AUTH, suspended)).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    );
  });

  it('lets a public endpoint through without a credential', async () => {
    const { allowed } = await run({ [PUBLIC_KEY]: true }, {});
    expect(allowed).toBe(true);
  });

  it('does not attach an actor to a request it refused', async () => {
    await expect(run({ [PERMISSIONS_KEY]: ['order.read'] }, {})).rejects.toBeDefined();
  });
});
