import { MAGAZINE_PAGE_SIZE } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { cardsForSlugs } from '@/server/catalogue/listing';
import {
  archivePage,
  ARTICLE_SLUGS,
  articlesBy,
  featuredArticle,
  findAuthor,
  findTopic,
  listArticles,
  listAuthors,
  normaliseForSearch,
  popularArticles,
  productSlugsIn,
  relatedArticles,
  searchArticles,
  tableOfContents,
  topicById,
  TOPICS,
} from '@/server/content/magazine';

/**
 * The magazine is content, so what is pinned here is integrity: every article
 * points at a topic, an author and products that exist; no slug collides with
 * a route; and the queries the pages make behave at their edges.
 */

describe('magazine content integrity', () => {
  it('gives every article a known topic and author, and a unique slug', () => {
    expect(new Set(ARTICLE_SLUGS).size).toBe(ARTICLE_SLUGS.length);
    for (const article of listArticles()) {
      expect(() => topicById(article.topic)).not.toThrow();
      expect(findAuthor(article.author)).toBeDefined();
    }
  });

  it('never uses a slug a blog route already owns', () => {
    for (const reserved of ['topics', 'search', 'authors']) {
      expect(ARTICLE_SLUGS).not.toContain(reserved);
    }
  });

  it('keeps heading ids unique within an article, and clear of the FAQ anchor', () => {
    for (const article of listArticles()) {
      const ids = tableOfContents(article.body).map((entry) => entry.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain('faq');
    }
  });

  it('only names products the catalogue has', async () => {
    const slugs = [...new Set(listArticles().flatMap((article) => productSlugsIn(article.body)))];
    const cards = await cardsForSlugs(slugs);
    expect(cards.map((card) => card.slug).toSorted()).toEqual(slugs.toSorted());
  });

  it('promises no instalment term the shop does not offer', () => {
    const text = JSON.stringify(listArticles());
    expect(text).not.toContain('۳۶ ماه');
    expect(text).not.toContain('سقف اعتبار');
  });
});

describe('magazine queries', () => {
  it('leads with the featured article', () => {
    expect(featuredArticle()?.featured).toBe(true);
  });

  it('pages an archive and clamps a page past the end', () => {
    const first = archivePage(null, { sort: 'newest', page: 1 });
    expect(first.items).toHaveLength(Math.min(MAGAZINE_PAGE_SIZE, first.total));
    expect(first.total).toBe(listArticles().length);

    const past = archivePage(null, { sort: 'newest', page: 99 });
    expect(past.page).toBe(past.pageCount);
    expect(past.items.length).toBeGreaterThan(0);
  });

  it('narrows to a topic and orders by popularity with date as the tie-break', () => {
    const market = findTopic('market');
    if (market === undefined) throw new Error('no market topic');

    const page = archivePage(market, { sort: 'popular', page: 1 });
    expect(page.items.every((article) => article.topic === 'market')).toBe(true);
    for (let index = 1; index < page.items.length; index += 1) {
      const before = page.items[index - 1];
      const after = page.items[index];
      if (before === undefined || after === undefined) continue;
      expect(before.popularity >= after.popularity).toBe(true);
      if (before.popularity === after.popularity) {
        expect(before.publishedAt >= after.publishedAt).toBe(true);
      }
    }
    expect(popularArticles(3)).toHaveLength(3);
  });

  it('matches regardless of Arabic letters, spacing and ZWNJ', () => {
    expect(normaliseForSearch('  تشخيص  اصالت ')).toBe('تشخیص اصالت');
    expect(searchArticles('حباب').length).toBeGreaterThan(0);
    // Typed with a space, stored with a zero-width non-joiner.
    expect(searchArticles('آب شده').map((article) => article.slug)).toContain(
      'coin-bullion-or-melt',
    );
    expect(searchArticles('تشخيص اصالت').length).toBeGreaterThan(0);
    expect(searchArticles('   ')).toEqual([]);
    expect(searchArticles('<script>')).toEqual([]);
  });

  it('lists an author’s own articles and relates same-topic articles first', () => {
    for (const author of listAuthors()) {
      expect(articlesBy(author).every((article) => article.author === author.slug)).toBe(true);
    }

    const article = featuredArticle();
    if (article === undefined) throw new Error('no featured article');
    const related = relatedArticles(article, 4);
    expect(related).toHaveLength(4);
    expect(related.map((other) => other.slug)).not.toContain(article.slug);
    expect(related[0]?.topic).toBe(article.topic);
  });

  it('gives every topic a unique URL segment', () => {
    expect(new Set(TOPICS.map((topic) => topic.slug)).size).toBe(TOPICS.length);
    expect(findTopic('nope')).toBeUndefined();
  });
});
