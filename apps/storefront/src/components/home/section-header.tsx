import Link from 'next/link';

import { ChevronIcon } from '@/components/icons';

/** How much room the design leaves between a heading and what follows it. */
export type SectionHeaderGap = 14 | 12 | 6 | 4;

const GAP_CLASS: Record<SectionHeaderGap, string> = {
  14: '',
  12: ' zn-sechead--gap-12',
  6: ' zn-sechead--gap-6',
  4: ' zn-sechead--gap-4',
};

/**
 * The heading-and-see-all row that opens most sections on the homepage.
 *
 * `id` is required when a link is present: the "see all" link needs an
 * accessible name that distinguishes it from the four other "see all" links on
 * the page, and pointing it at the heading is how a screen reader user tells
 * «مشاهده همه» for new arrivals from «مشاهده همه» for best sellers.
 *
 * `link` follows the design, which uses the outlined pill everywhere except the
 * magazine — there it is plain text, because the rail below it already carries
 * the section's visual weight and a second pill would compete with the cards.
 */
export function SectionHeader({
  id,
  title,
  href,
  linkLabel = 'مشاهده همه',
  tone = 'light',
  link = 'pill',
  gap = 14,
}: {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly tone?: 'light' | 'dark';
  readonly link?: 'pill' | 'plain';
  readonly gap?: SectionHeaderGap;
}) {
  return (
    <div className={`zn-sechead zn-sechead--${tone}${GAP_CLASS[gap]}`}>
      <h2 className="zn-sechead__title" id={id}>
        {title}
      </h2>
      {href === undefined ? null : (
        <Link
          className={link === 'pill' ? 'zn-seeall' : 'zn-seeall-plain'}
          href={href}
          aria-describedby={id}
        >
          {linkLabel}
          {link === 'pill' ? <ChevronIcon size={14} /> : null}
        </Link>
      )}
    </div>
  );
}
