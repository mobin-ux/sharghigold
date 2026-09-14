import Link from 'next/link';

import { MediaPlaceholder } from '@/components/media-placeholder';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import type { Article, Author } from '@/server/content/magazine';

/*
 * Every way the magazine draws an article in a list. Each card is one link
 * whose text is the title, so a screen reader hears the headline rather than
 * the whole card. Images are placeholders until photography exists; the media
 * box is the slot `next/image` drops into.
 */

function minutes(article: Article): string {
  return persianCount(article.readingMinutes);
}

/** The magazine home's lead story. */
export function FeaturedArticleCard({
  article,
  topicLabel,
  author,
  badge,
}: {
  readonly article: Article;
  readonly topicLabel: string;
  readonly author: Author | undefined;
  readonly badge: string;
}) {
  return (
    <Link className="zn-magfeature" href={routes.article(article.slug)}>
      <span className="zn-magfeature__media">
        <MediaPlaceholder label="تصویر مقاله شاخص" />
        <span className="zn-magfeature__badge">{badge}</span>
      </span>
      <span className="zn-magfeature__body">
        <span className="zn-magcard__topic">{topicLabel}</span>
        <span className="zn-magfeature__title">{article.title}</span>
        <span className="zn-magfeature__lede">{article.lede}</span>
        <span className="zn-magfeature__meta">
          {author === undefined ? null : (
            <>
              <span className="zn-magavatar zn-magavatar--xs" aria-hidden="true">
                {author.initials}
              </span>
              <span>{author.name}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={article.publishedAt}>{article.published}</time>
          <span aria-hidden="true">·</span>
          <span>{`${minutes(article)} دقیقه`}</span>
        </span>
      </span>
    </Link>
  );
}

/**
 * The horizontal card: thumbnail, topic, title, date. `size` is the
 * thumbnail's edge — the canvas draws it at 92 on the home page, 88 in an
 * archive and 80 on an author's page.
 */
export function ArticleRow({
  article,
  topicLabel,
  size,
  longMeta = false,
}: {
  readonly article: Article;
  readonly topicLabel: string;
  readonly size: 92 | 88 | 80;
  /** «دقیقه مطالعه» rather than «دقیقه», as the home page words it. */
  readonly longMeta?: boolean;
}) {
  return (
    <Link className={`zn-magrow zn-magrow--${size}`} href={routes.article(article.slug)}>
      <span className="zn-magrow__media">
        <MediaPlaceholder label="تصویر" />
      </span>
      <span className="zn-magrow__body">
        <span className="zn-magcard__topic">{topicLabel}</span>
        <span className="zn-magrow__title">{article.title}</span>
        <span className="zn-magrow__meta">
          <time dateTime={article.publishedAt}>{article.published}</time>
          {` · ${minutes(article)} ${longMeta ? 'دقیقه مطالعه' : 'دقیقه'}`}
        </span>
      </span>
    </Link>
  );
}

/** A search result: no picture, but the lede, so a reader can tell matches apart. */
export function ArticleResult({
  article,
  topicLabel,
}: {
  readonly article: Article;
  readonly topicLabel: string;
}) {
  return (
    <Link className="zn-magresult" href={routes.article(article.slug)}>
      <span className="zn-magcard__topic">{topicLabel}</span>
      <span className="zn-magresult__title">{article.title}</span>
      <span className="zn-magresult__lede">{article.lede}</span>
      <span className="zn-magresult__meta">
        <time dateTime={article.publishedAt}>{article.published}</time>
        {` · ${minutes(article)} دقیقه`}
      </span>
    </Link>
  );
}

/** A ranked title, for «پربازدیدترین‌ها». */
export function RankedArticle({
  article,
  rank,
}: {
  readonly article: Article;
  readonly rank: number;
}) {
  return (
    <Link className="zn-magrank" href={routes.article(article.slug)}>
      <span className="zn-magrank__n" aria-hidden="true">
        {persianCount(rank)}
      </span>
      <span className="zn-magrank__title">{article.title}</span>
    </Link>
  );
}

/** A card in the «مقاله‌های مرتبط» rail. */
export function RelatedArticleCard({
  article,
  topicLabel,
}: {
  readonly article: Article;
  readonly topicLabel: string;
}) {
  return (
    <Link className="zn-magrelated" href={routes.article(article.slug)}>
      <span className="zn-magrelated__media">
        <MediaPlaceholder label="تصویر" />
      </span>
      <span className="zn-magrelated__body">
        <span className="zn-magcard__topic">{topicLabel}</span>
        <span className="zn-magrelated__title">{article.title}</span>
        <span className="zn-magrelated__meta">{`${minutes(article)} دقیقه مطالعه`}</span>
      </span>
    </Link>
  );
}
