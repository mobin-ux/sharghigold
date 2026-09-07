import Link from 'next/link';

import { ChevronIcon } from '@/components/icons';

/**
 * The heading-and-see-all row that opens most sections on the homepage.
 *
 * `id` is required when a link is present: the "see all" link needs an
 * accessible name that distinguishes it from the four other "see all" links on
 * the page, and pointing it at the heading is how a screen reader user tells
 * «مشاهده همه» for new arrivals from «مشاهده همه» for best sellers.
 */
export function SectionHeader({
  id,
  title,
  href,
  linkLabel = 'مشاهده همه',
  tone = 'light',
}: {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly tone?: 'light' | 'dark';
}) {
  return (
    <div className={`zn-sechead zn-sechead--${tone}`}>
      <h2 className="zn-sechead__title" id={id}>
        {title}
      </h2>
      {href === undefined ? null : (
        <Link className="zn-seeall" href={href} aria-describedby={id}>
          {linkLabel}
          <ChevronIcon size={14} />
        </Link>
      )}
    </div>
  );
}
