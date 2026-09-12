import type { Metadata } from 'next';
import Link from 'next/link';
import { toPersianDigits } from '@sharghigold/ui';

import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { BRAND } from '@/config/brand';
import { routes } from '@/lib/routes';
import { listArticles } from '@/server/content/magazine';

import '../doc.css';

export const metadata: Metadata = {
  title: `مجله ${BRAND.name}`,
  description: 'راهنمای خرید و تحلیل بازار طلا، نوشته کارشناسان.',
  alternates: { canonical: '/blog' },
};

/**
 * The magazine index.
 *
 * The homepage rail has linked here since it was built, and so has the footer.
 * Neither destination existed.
 */
export default function BlogPage() {
  const articles = listArticles();

  return (
    <>
      <a className="skip-link" href="#content">
        رفتن به فهرست مقاله‌ها
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main className="zn-doc" id="content">
          <header className="zn-doc__head">
            <h1 className="zn-doc__title">{`مجله ${BRAND.name}`}</h1>
            <p className="zn-doc__lede">
              راهنمای خرید و تحلیل بازار، نوشته کارشناسان فروشگاه. هیچ مطلبی در این مجله توصیه
              سرمایه‌گذاری نیست.
            </p>
          </header>

          <ul className="zn-postlist">
            {articles.map((article) => (
              <li className="zn-postrow" key={article.slug}>
                <span className="zn-postrow__cat">{article.category}</span>
                <h2 className="zn-postrow__title">
                  <Link href={routes.article(article.slug)}>{article.title}</Link>
                </h2>
                <p className="zn-postrow__lede">{article.lede}</p>
                <p className="zn-postrow__meta">
                  <time dateTime={article.publishedAt}>{article.published}</time>
                  <span aria-hidden="true">·</span>
                  <span>{`${toPersianDigits(article.readingMinutes)} دقیقه مطالعه`}</span>
                </p>
              </li>
            ))}
          </ul>
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
