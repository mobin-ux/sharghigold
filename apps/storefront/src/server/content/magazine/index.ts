/**
 * The magazine gateway: every read the blog pages make.
 *
 * One function per question a page asks, so swapping these fixtures for the
 * admin panel's rows changes this file and nothing above it.
 * Every lookup compares a URL segment against keys this module already holds;
 * nothing a reader sends is used to build a path or a query.
 */
import {
  MAGAZINE_PAGE_SIZE,
  type MagazineArchiveQuery,
  type MagazineSort,
} from '@sharghigold/contracts';

import { ARTICLES } from './articles';
import { AUTHORS } from './authors';
import { ALL_TOPICS, TOPICS } from './topics';
import type { Article, ArticleBlock, Author, Topic, TopicId } from './types';

export type { Article, ArticleBlock, Author, Inline, Topic, TopicId } from './types';
export { ALL_TOPICS, TOPICS } from './topics';

/** Words the blog uses that are not articles. */
export const MAGAZINE_COPY = {
  name: 'مجله زرنما',
  badge: 'راهنمای خرید و تحلیل بازار طلا',
  lede: 'راهنمای خرید طلا، سکه و شمش؛ تحلیل قیمت، تشخیص اصالت و هر چیزی که قبل از خرید باید بدانید. نوشته‌ی کارشناسان زرنما.',
  /** The canvas's «موضوع‌های پرجست‌وجو». Chosen by an editor, so not called popular. */
  suggestedSearches: [
    'حباب سکه',
    'آب‌شده',
    'شمش',
    'اجرت ساخت',
    'طلای تقلبی',
    'خرید اقساطی',
    'فاکتور',
    'تمیز کردن طلا',
  ],
  disclaimer:
    'این مقاله تحلیل کارشناسی است و توصیه سرمایه‌گذاری محسوب نمی‌شود. تصمیم خرید بر عهده خواننده است.',
} as const;

const byNewest = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);

const ORDER: Record<MagazineSort, (a: Article, b: Article) => number> = {
  newest: byNewest,
  // Ties fall back to date, so the order is total and a page boundary is stable.
  popular: (a, b) => b.popularity - a.popularity || byNewest(a, b),
};

/**
 * Every article slug. Path segments the blog serves as pages of their own —
 * `topics`, `search`, `authors` — are never valid slugs; a test holds that.
 */
export const ARTICLE_SLUGS: readonly string[] = ARTICLES.map((article) => article.slug);

/** Newest first. */
export function listArticles(): readonly Article[] {
  return ARTICLES.toSorted(byNewest);
}

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

/** The article the magazine home leads with: the flagged one, else the newest. */
export function featuredArticle(): Article | undefined {
  return ARTICLES.find((article) => article.featured === true) ?? listArticles()[0];
}

export function findTopic(slug: string): Topic | undefined {
  return TOPICS.find((topic) => topic.slug === slug);
}

export function topicById(id: TopicId): Topic {
  const topic = TOPICS.find((entry) => entry.id === id);
  if (topic === undefined) throw new Error(`unknown magazine topic ${id}`);
  return topic;
}

export function findAuthor(slug: string): Author | undefined {
  return AUTHORS.find((author) => author.slug === slug);
}

export function listAuthors(): readonly Author[] {
  return AUTHORS;
}

export interface ArchivePage {
  /** Null for every topic at once. */
  readonly topic: Topic | null;
  readonly label: string;
  readonly description: string;
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
  readonly items: readonly Article[];
}

/**
 * One page of a topic, or of everything.
 *
 * A page past the end is clamped to the last page rather than being empty: a
 * stale `?page=9` link after articles were unpublished still shows articles.
 */
export function archivePage(topic: Topic | null, query: MagazineArchiveQuery): ArchivePage {
  const matching = ARTICLES.filter((article) => topic === null || article.topic === topic.id);
  const sorted = matching.toSorted(ORDER[query.sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / MAGAZINE_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);

  return {
    topic,
    label: topic?.label ?? ALL_TOPICS.label,
    description: topic?.description ?? ALL_TOPICS.description,
    total: sorted.length,
    page,
    pageCount,
    items: sorted.slice((page - 1) * MAGAZINE_PAGE_SIZE, page * MAGAZINE_PAGE_SIZE),
  };
}

/**
 * Normalise Persian text for matching.
 *
 * Arabic yeh and kaf are the same letters to a reader and arrive from some
 * keyboards; the zero-width non-joiner is spacing, not spelling.
 */
export function normaliseForSearch(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200C/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Articles whose title, lede or topic contain the term, newest first. */
export function searchArticles(term: string): readonly Article[] {
  const needle = normaliseForSearch(term);
  if (needle === '') return [];

  return listArticles().filter((article) =>
    normaliseForSearch(
      `${article.title} ${article.lede} ${topicById(article.topic).label}`,
    ).includes(needle),
  );
}

/** The most-read articles. */
export function popularArticles(count: number): readonly Article[] {
  return ARTICLES.toSorted(ORDER.popular).slice(0, count);
}

export function articlesBy(author: Author): readonly Article[] {
  return listArticles().filter((article) => article.author === author.slug);
}

/** Others from the same topic first, then the newest of the rest. */
export function relatedArticles(article: Article, count: number): readonly Article[] {
  const others = listArticles().filter((other) => other.slug !== article.slug);
  const same = others.filter((other) => other.topic === article.topic);
  const rest = others.filter((other) => other.topic !== article.topic);
  return [...same, ...rest].slice(0, count);
}

/** The table of contents: every heading block, in order. */
export function tableOfContents(
  body: readonly ArticleBlock[],
): readonly { readonly id: string; readonly text: string }[] {
  return body.flatMap((block) =>
    block.kind === 'heading' ? [{ id: block.id, text: block.text }] : [],
  );
}

/** Every product slug an article's body mentions, for one catalogue read. */
export function productSlugsIn(body: readonly ArticleBlock[]): readonly string[] {
  return body.flatMap((block) => (block.kind === 'products' ? block.slugs : []));
}
