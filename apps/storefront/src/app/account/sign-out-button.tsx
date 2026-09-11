import { SubmitButton } from '@/components/account/submit-button';

import { signOut } from './actions';

/**
 * The sign-out control.
 *
 * A form rather than a link. The action revokes the session on the server
 * before clearing the cookie, so «خارج شدم» is true of the shop and not only
 * of this browser.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton className="zn-signout__button" pendingLabel="در حال خروج…">
        خروج از حساب کاربری
      </SubmitButton>
    </form>
  );
}
