import Link from 'next/link';
import type { MagazineArchiveQuery, MagazineSort } from '@sharghigold/contracts';

import { BottomNav } from '@/components/bottom-nav';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { archivePage, topicById, TOPICS, type Topic } from '@/server/content/magazine';

import { ArticleRow } from './article-cards';
import { MagazineCrumbs, MagazineHeader, MagazinePager, TopicChips } from './magazine-chrome';

const SORTS: readonly { readonly id: MagazineSort; readonly label: string }[] = [
  { id: 'newest', label: 'تازه‌ترین' },
  { id: 'popular', label: 'پربازدید' },
];

/**
 * A topic archive — or every article, when `topic` is null.
 *
 * Shared by `/blog/topics` and `/blog/topics/:topic`. Sorting and paging are
 * links, so an archive page is an address and works without JavaScript.
 */
export function ArchiveView({
  topic,
  query,
}: {
  readonly topic: Topic | null;
  readonly query: MagazineArchiveQuery;
}) {
  const archive = archivePage(topic, query);
  const topicSlug = topic?.slug;

  return (
    <>
      <a className="skip-link" href="#articles">
        رفتن به فهرست مقاله‌ها
      </a>

      <div className="zn-shell zn-shell--magazine">
        <MagazineHeader title={archive.label} back={routes.blog()} />

        <main>
          <MagazineCrumbs
            crumbs={[
              { label: 'خانه', href: routes.home() },
              { label: 'مجله', href: routes.blog() },
              { label: archive.label },
            ]}
          />

          <section className="zn-magarch" aria-labelledby="archive-title">
            <h1 className="zn-magarch__title" id="archive-title">
              {archive.label}
            </h1>
            <p className="zn-magarch__lede">{archive.description}</p>
            <div className="zn-magarch__bar">
              <span className="zn-magarch__count" role="status">
                {`${persianCount(archive.total)} مقاله`}
              </span>
              <nav className="zn-magarch__sorts" aria-label="ترتیب">
                {SORTS.map((sort) => (
                  <Link
                    className={`zn-magchip zn-magchip--sort${sort.id === query.sort ? ' zn-magchip--on' : ''}`}
                    key={sort.id}
                    href={routes.blogTopic(topicSlug, { sort: sort.id })}
                    aria-current={sort.id === query.sort ? 'true' : undefined}
                  >
                    {sort.label}
                  </Link>
                ))}
              </nav>
            </div>
          </section>

          <TopicChips topics={TOPICS} current={topicSlug ?? 'all'} size="sm" />

          <section className="zn-magarch__list" id="articles" aria-label="مقاله‌ها">
            {archive.items.length === 0 ? (
              <div className="zn-magempty">
                <span className="zn-magempty__title">فعلاً مقاله‌ای در این موضوع نیست</span>
                <span className="zn-magempty__body">
                  موضوع دیگری را انتخاب کنید یا در مجله جست‌وجو کنید.
                </span>
              </div>
            ) : (
              <ul className="zn-maglist">
                {archive.items.map((article) => (
                  <li key={article.slug}>
                    <ArticleRow
                      article={article}
                      topicLabel={topicById(article.topic).label}
                      size={88}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="zn-magarch__pager">
            <MagazinePager
              page={archive.page}
              pageCount={archive.pageCount}
              hrefFor={(page) => routes.blogTopic(topicSlug, { sort: query.sort, page })}
            />
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
