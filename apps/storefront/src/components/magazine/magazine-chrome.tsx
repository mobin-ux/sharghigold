import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon, SearchIcon } from '@/components/icons';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { ALL_TOPICS, type Topic } from '@/server/content/magazine';

/*
 * The frame every magazine page shares: the sticky header, the trail, the
 * topic chips and the pager. All of it is links. The canvas switches between
 * its views in component state; here each view is its own address, so a topic,
 * a search or an article can be shared, reloaded and crawled.
 */

/** Back, the page's name, search, and — on an article — a trailing slot. */
export function MagazineHeader({
  title,
  back,
  trailing,
}: {
  readonly title: string;
  readonly back: string;
  /** The reading-progress bar under an article's header. */
  readonly trailing?: ReactNode;
}) {
  return (
    <header className="zn-maghead">
      <div className="zn-maghead__row">
        <Link className="zn-maghead__btn zn-maghead__btn--back" href={back} aria-label="بازگشت">
          <ArrowRightIcon size={20} />
        </Link>
        <span className="zn-maghead__title">{title}</span>
        <Link
          className="zn-maghead__btn zn-maghead__btn--search"
          href={routes.blogSearch()}
          aria-label="جست‌وجو در مجله"
        >
          <SearchIcon size={19} strokeWidth={1.8} />
        </Link>
      </div>
      {trailing}
    </header>
  );
}

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/** «خانه › مجله › …», the last step unlinked and current. */
export function MagazineCrumbs({ crumbs }: { readonly crumbs: readonly Crumb[] }) {
  return (
    <nav className="zn-magcrumbs" aria-label="مسیر">
      <ol className="zn-magcrumbs__list">
        {crumbs.map((crumb) => (
          <li className="zn-magcrumbs__item" key={crumb.label}>
            {crumb.href === undefined ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The topic chips. `current` is the archive being shown; on the magazine home
 * nothing is current, as the canvas draws it.
 */
export function TopicChips({
  topics,
  current,
  size = 'lg',
}: {
  readonly topics: readonly Topic[];
  /** A topic slug, `'all'`, or null when no archive is open. */
  readonly current: string | null;
  readonly size?: 'lg' | 'sm';
}) {
  const chips = [
    { key: 'all', label: ALL_TOPICS.chip, href: routes.blogTopic() },
    ...topics.map((topic) => ({
      key: topic.slug,
      label: topic.label,
      href: routes.blogTopic(topic.slug),
    })),
  ];

  return (
    <nav className={`zn-magchips zn-magchips--${size}`} aria-label="موضوع‌ها">
      {chips.map((chip) => (
        <Link
          className={`zn-magchip${chip.key === current ? ' zn-magchip--on' : ''}`}
          key={chip.key}
          href={chip.href}
          aria-current={chip.key === current ? 'page' : undefined}
        >
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}

/** Page links, one per page, the current one marked. */
export function MagazinePager({
  page,
  pageCount,
  hrefFor,
}: {
  readonly page: number;
  readonly pageCount: number;
  readonly hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="zn-magpager" aria-label="صفحه‌ها">
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <Link
          className={`zn-magchip zn-magpager__page${number === page ? ' zn-magchip--on' : ''}`}
          key={number}
          href={hrefFor(number)}
          aria-current={number === page ? 'page' : undefined}
          aria-label={`صفحه ${persianCount(number)}`}
        >
          {persianCount(number)}
        </Link>
      ))}
    </nav>
  );
}
