import Link from 'next/link';

import { PencilIcon } from '@/components/icons';
import { initialOf, mobileLabel, nameOrDefault } from '@/lib/account-view';
import { routes } from '@/lib/routes';

interface AccountHeroProps {
  readonly displayName: string | null;
  readonly mobile: string;
}

/**
 * The teal band at the top of the account home.
 *
 * The mobile number is the account identity, so it is what the header shows
 * under the name — and it is set `dir="ltr"` explicitly. A number left to the
 * page's RTL direction has its leading zero pushed to the wrong end.
 */
export function AccountHero({ displayName, mobile }: AccountHeroProps) {
  return (
    <header className="zn-achero">
      <span className="zn-achero__avatar" aria-hidden="true">
        {initialOf(displayName)}
      </span>
      <span className="zn-achero__who">
        <span className="zn-achero__name">{nameOrDefault(displayName)}</span>
        <span className="zn-achero__mobile" dir="ltr">
          {mobileLabel(mobile)}
        </span>
      </span>
      <Link className="zn-achero__edit" href={routes.accountProfile()} aria-label="ویرایش پروفایل">
        <PencilIcon size={18} />
      </Link>
    </header>
  );
}
