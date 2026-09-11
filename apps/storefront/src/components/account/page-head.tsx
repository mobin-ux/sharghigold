import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowIcon } from '@/components/icons';

interface PageHeadProps {
  readonly title: string;
  /** Where the back arrow goes. A real link, so it works before hydration. */
  readonly back: string;
  /** Right-hand slot: the step counter on the verification screens. */
  readonly trailing?: ReactNode;
}

/**
 * The sticky bar at the top of every account screen but the home one.
 *
 * The back control is a `<Link>` to a known parent rather than
 * `history.back()`. The design uses the latter, which sends a customer who
 * arrived from a search result out of the site — and offers nothing to
 * middle-click, long-press or crawl.
 */
export function PageHead({ title, back, trailing }: PageHeadProps) {
  return (
    <header className="zn-achead">
      <Link className="zn-achead__back" href={back} aria-label="بازگشت">
        <ArrowIcon size={20} strokeWidth={1.9} />
      </Link>
      <h1 className="zn-achead__title">{title}</h1>
      {trailing === undefined ? null : <span className="zn-achead__trail">{trailing}</span>}
    </header>
  );
}
