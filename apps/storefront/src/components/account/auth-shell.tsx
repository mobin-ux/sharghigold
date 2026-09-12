import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowIcon } from '@/components/icons';
import { BRAND } from '@/config/brand';
import { routes } from '@/lib/routes';

interface AuthShellProps {
  readonly title: string;
  readonly lead: string;
  /** Where the back arrow goes. Every step knows its own predecessor. */
  readonly back: string;
  /**
   * The step itself — a form holding both its fields and its primary button,
   * because the button submits the fields and the two cannot live in
   * different elements.
   */
  readonly children: ReactNode;
}

/**
 * The frame the four sign-in steps share.
 *
 * `<h1>` is the step's own title rather than the brand: the first heading on a
 * page should say what the page is for, and «زرنما» is already the site name
 * in the document title.
 *
 * The «فعلاً نه» link goes home. Sign-in is not a wall — most of the shop is
 * readable without an account, and somebody who reached this screen by tapping
 * the wrong tab needs a way out that is not the browser's back button.
 */
export function AuthShell({ title, lead, back, children }: AuthShellProps) {
  return (
    <div className="zn-shell zn-auth">
      <div className="zn-auth__top">
        <Link className="zn-auth__back" href={back} aria-label="بازگشت">
          <ArrowIcon size={20} strokeWidth={1.9} />
        </Link>
        <Link className="zn-auth__skip" href={routes.home()}>
          فعلاً نه
        </Link>
      </div>

      <main className="zn-auth__body">
        <span className="zn-auth__mark" aria-hidden="true">
          {Array.from(BRAND.name)[0]}
        </span>
        <h1 className="zn-auth__title">{title}</h1>
        <p className="zn-auth__lead">{lead}</p>

        {children}
      </main>
    </div>
  );
}
