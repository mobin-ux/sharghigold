/**
 * Declaring what an administrative endpoint needs.
 *
 * The permission is written on the handler rather than checked inside it, so
 * that it can be read without running the code — by a reviewer, and by a test
 * that walks every route and asserts each one declares something.
 *
 * The argument is typed as `AdminPermission`, so a permission that is not in
 * the shared closed set is a compile error rather than a string that silently
 * matches nothing and locks everybody out.
 */
import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { AdminPermission } from '@sharghigold/contracts';

export const PERMISSIONS_KEY = 'admin:permissions';
export const PUBLIC_KEY = 'admin:public';

/**
 * Every listed permission must be held. Not any of them.
 *
 * «Read the order and refund it» is one action that needs both, and the
 * permissive reading is the one that eventually grants a refund to somebody
 * who was only meant to look.
 */
export function RequirePermissions(
  ...permissions: readonly [AdminPermission, ...AdminPermission[]]
): CustomDecorator<string> {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

/**
 * Exempt a handler from the guard.
 *
 * Explicit, because the guard refuses anything that declares nothing. An
 * endpoint that is genuinely public says so here, in one word a reviewer can
 * search for, rather than being public by omission.
 */
export function PublicEndpoint(): CustomDecorator<string> {
  return SetMetadata(PUBLIC_KEY, true);
}
