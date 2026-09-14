import type { Metadata } from 'next';
import Link from 'next/link';
import { formatToman } from '@sharghigold/money';

import { BottomNav } from '@/components/bottom-nav';
import { ArticleRow, FeaturedArticleCard } from '@/components/magazine/article-cards';
import { MagazineHeader, TopicChips } from '@/components/magazine/magazine-chrome';
import { AdviceCard, MagazineMasthead, RateStrip } from '@/components/magazine/magazine-panels';
import { NewsletterCard } from '@/components/magazine/newsletter-card';
import { getGoldRate } from '@/lib/gold-price';
import { routes } from '@/lib/routes';
import {
  featuredArticle,
  findAuthor,
  listArticles,
  listAuthors,
  MAGAZINE_COPY,
  topicById,
  TOPICS,
} from '@/server/content/magazine';

import './magazine.css';

export const metadata: Metadata = {
  title: MAGAZINE_COPY.name,
  description: MAGAZINE_COPY.lede,
  alternates: { canonical: routes.blog() },
};

/** How many articles follow the lead story on the home page. */
const LATEST_COUNT = 5;

/**
 * The magazine home, as the `Zarnama Blog` canvas draws its feed.
 *
 * Static: nothing on it depends on the reader. The newsletter card is the one
 * client island, because it shows the answer to its own submission.
 */
export default function MagazinePage() {
  const featured = featuredArticle();
  const latest = listArticles()
    .filter((article) => article.slug !== featured?.slug)
    .slice(0, LATEST_COUNT);
  const rate = getGoldRate();

  return (
    <>
      <a className="skip-link" href="#latest">
        رفتن به تازه‌ترین مقاله‌ها
      </a>

      <div className="zn-shell zn-shell--magazine">
        <MagazineHeader title={MAGAZINE_COPY.name} back={routes.home()} />

        <main>
          <MagazineMasthead
            name={MAGAZINE_COPY.name}
            badge={MAGAZINE_COPY.badge}
            lede={MAGAZINE_COPY.lede}
            stats={[
              { value: listArticles().length, label: 'مقاله کارشناسی' },
              { value: TOPICS.length, label: 'موضوع تخصصی' },
              { value: listAuthors().length, label: 'نویسنده کارشناس' },
            ]}
          />

          <TopicChips topics={TOPICS} current={null} />

          {featured === undefined ? null : (
            <section className="zn-magsec zn-magsec--feature" aria-label="مقاله شاخص">
              <FeaturedArticleCard
                article={featured}
                topicLabel={topicById(featured.topic).label}
                author={findAuthor(featured.author)}
                badge="مقاله شاخص"
              />
            </section>
          )}

          <RateStrip
            price={formatToman(rate.pricePerGram18k, { withUnit: false })}
            isLive={rate.isLive}
            asOf={rate.asOf}
          />

          <section
            className="zn-magsec zn-magsec--latest"
            id="latest"
            aria-labelledby="latest-title"
          >
            <h2 className="zn-magsec__title zn-magsec__title--tight" id="latest-title">
              تازه‌ترین مقاله‌ها
            </h2>
            <p className="zn-magsec__lede">مرتب‌شده بر اساس تاریخ انتشار</p>
            <ul className="zn-maglist">
              {latest.map((article) => (
                <li key={article.slug}>
                  <ArticleRow
                    article={article}
                    topicLabel={topicById(article.topic).label}
                    size={92}
                    longMeta
                  />
                </li>
              ))}
            </ul>
            <Link
              className="zn-magbtn zn-magbtn--outline zn-magbtn--block"
              href={routes.blogTopic()}
            >
              مشاهده همه مقاله‌ها
            </Link>
          </section>

          <NewsletterCard />

          <section className="zn-magsec zn-magsec--tags" aria-labelledby="tags-title">
            <h2 className="zn-magsec__title zn-magsec__title--tags" id="tags-title">
              موضوع‌های پیشنهادی
            </h2>
            <ul className="zn-magtags">
              {MAGAZINE_COPY.suggestedSearches.map((term) => (
                <li key={term}>
                  <Link className="zn-magtag" href={routes.blogSearch(term)}>
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <AdviceCard />
        </main>

        <BottomNav />
      </div>
    </>
  );
}
