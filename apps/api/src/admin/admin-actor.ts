/**
 * Who is making an administrative request, and where that answer comes from.
 *
 * The answer is *not* in the request. An `AdminActor` is resolved by the API
 * from a credential, against records the API loaded itself — a header naming
 * a role, or a permission list in a token body the client could edit, is a
 * client choosing its own authorisation.
 *
 * `AdminDirectory` is deliberately an interface with no implementation in this
 * commit. The authorisation *decision* is the part that is expensive to get
 * wrong and is written and tested now; how an administrator signs in is a
 * separate piece of work with its own decisions — session or token, where the
 * second factor sits, how a revoked account is noticed — and inventing an
 * answer here would be inventing the wrong one.
 *
 * Any implementation must hold to two things, because the guard depends on
 * them:
 *
 *   * It reads `isActive` and the permission set from storage on each request,
 *     or from a cache it invalidates when a role changes. A permission list
 *     baked into a long-lived token cannot be taken away.
 *   * It returns undefined for an unknown or expired credential. It never
 *     throws to mean «not signed in», because a thrown error and a refused
 *     credential would take different paths through the filter.
 */
import type { AdminPermission } from '@sharghigold/contracts';

/**
 * The administrator behind a request.
 *
 * The same shape `can()` takes, so the guard, the panel and any future service
 * all ask the question with one function rather than three re-implementations
 * of «does this list contain that string».
 */
export interface AdminActor {
  readonly id: string;
  readonly isActive: boolean;
  readonly permissions: readonly AdminPermission[];
}

export interface AdminDirectory {
  /**
   * Resolve the actor behind a credential, or undefined.
   *
   * `credential` is whatever the Authorization header carried, unparsed. It is
   * opaque to the guard on purpose: whether it is a session token or a signed
   * assertion is the directory's business, and the guard must not grow a
   * second opinion about it.
   */
  resolve(credential: string | undefined): Promise<AdminActor | undefined>;
}

/** Injection token. Nest cannot inject an interface, so the token is the name. */
export const ADMIN_DIRECTORY = Symbol('ADMIN_DIRECTORY');

/** Where the guard stashes the resolved actor for the handler to read. */
export const ADMIN_ACTOR_KEY = 'adminActor';
