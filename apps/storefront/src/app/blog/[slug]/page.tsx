import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BottomNav } from '@/components/bottom-nav';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { RelatedArticleCard } from '@/components/magazine/article-cards';
import {
  ArticleBody,
  ArticleFaq,
  ArticleHeading,
  ArticleSources,
  ArticleSummary,
  AuthorBox,
  TableOfContents,
} from '@/components/magazine/article-parts';
import { MagazineCrumbs, MagazineHeader } from '@/components/magazine/magazine-chrome';
import { ReadingProgress } from '@/components/magazine/reading-progress';
import { routes } from '@/lib/routes';
import { cardsForSlugs } from '@/server/catalogue/listing';
import {
  ARTICLE_SLUGS,
  findArticle,
  findAuthor,
  MAGAZINE_COPY,
  productSlugsIn,
  relatedArticles,
  tableOfContents,
  topicById,
} from '@/server/content/magazine';

import '../magazine.css';

type Params = Promise<{ readonly slug: string }>;

/** The set of articles is known at build time, so each one is static HTML. */
export function generateStaticParams() {
  return ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const article = findArticle((await params).slug);

  if (article === undefined) return { title: 'مقاله پیدا نشد' };

  return {
    title: article.title,
    description: article.lede,
    alternates: { canonical: routes.article(article.slug) },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.lede,
      publishedTime: article.publishedAt,
      modifiedTime: article.reviewedAt,
    },
  };
}

/**
 * One article, as the canvas's article view draws it.
 *
 * The body is typed blocks rendered on the server. The reading-progress line
 * is the only client code. The canvas's bookmark button is not drawn: there is
 * no saved-articles list to add to, and a toggle that forgets on reload is a
 * control that lies.
 */
export default async function ArticlePage({ params }: { readonly params: Params }) {
  const article = findArticle((await params).slug);

  if (article === undefined) notFound();

  const topic = topicById(article.topic);
  const author = findAuthor(article.author);
  const cards = await cardsForSlugs(productSlugsIn(article.body));
  const products = new Map(cards.map((card) => [card.slug, card]));
  const faqs = article.faqs ?? [];

  return (
    <>
      <a className="skip-link" href="#article">
        رفتن به متن مقاله
      </a>

      <div className="zn-shell zn-shell--magazine">
        <MagazineHeader title={topic.label} back={routes.blog()} trailing={<ReadingProgress />} />

        <main>
          <article id="article">
            <MagazineCrumbs
              crumbs={[
                { label: 'خانه', href: routes.home() },
                { label: 'مجله', href: routes.blog() },
                { label: topic.label, href: routes.blogTopic(topic.slug) },
              ]}
            />

            <ArticleHeading article={article} author={author} />

            <figure className="zn-magfigure">
              <span className="zn-magfigure__media">
                <MediaPlaceholder label="تصویر شاخص مقاله" />
              </span>
              {article.imageCaption === undefined ? null : (
                <figcaption className="zn-magfigure__cap">{article.imageCaption}</figcaption>
              )}
            </figure>

            <TableOfContents entries={tableOfContents(article.body)} hasFaq={faqs.length > 0} />
            {article.summary === undefined ? null : <ArticleSummary points={article.summary} />}

            <ArticleBody blocks={article.body} products={products} />

            {faqs.length === 0 ? null : <ArticleFaq questions={faqs} />}
            <ArticleSources sources={article.sources} disclaimer={MAGAZINE_COPY.disclaimer} />
            {author === undefined ? null : <AuthorBox author={author} />}
          </article>

          <section className="zn-magsec" aria-labelledby="related-title">
            <h2 className="zn-magsec__title" id="related-title">
              مقاله‌های مرتبط
            </h2>
            <ul className="zn-magrelatedrail">
              {relatedArticles(article, 4).map((other) => (
                <li key={other.slug}>
                  <RelatedArticleCard article={other} topicLabel={topicById(other.topic).label} />
                </li>
              ))}
            </ul>
          </section>

          <section className="zn-magsec zn-magsec--end" aria-labelledby="next-title">
            <div className="zn-magnext">
              <h2 className="zn-magnext__title" id="next-title">
                مقاله بعدی را از دست ندهید
              </h2>
              <p className="zn-magnext__body">
                با عضویت در خبرنامه پیامکی، از تازه‌های زرنما باخبر شوید.
              </p>
              <Link
                className="zn-magbtn zn-magbtn--gold zn-magbtn--block"
                href={`${routes.blog()}#newsletter`}
              >
                عضویت در خبرنامه
              </Link>
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
