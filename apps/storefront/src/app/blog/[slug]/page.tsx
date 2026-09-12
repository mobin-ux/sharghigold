import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { toPersianDigits } from '@sharghigold/ui';

import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { routes } from '@/lib/routes';
import { ARTICLES, findArticle, listArticles } from '@/server/content/magazine';

import '../../doc.css';

/** The set of articles is known at build time, so each one is static HTML. */
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const article = findArticle((await params).slug);

  if (article === undefined) return { title: 'مقاله پیدا نشد' };

  return {
    title: article.title,
    description: article.lede,
    alternates: { canonical: routes.article(article.slug) },
    openGraph: { type: 'article', title: article.title, description: article.lede },
  };
}

export default async function ArticlePage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const article = findArticle(slug);

  if (article === undefined) notFound();

  const others = listArticles().filter((other) => other.slug !== article.slug);

  return (
    <>
      <a className="skip-link" href="#content">
        رفتن به متن مقاله
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main className="zn-doc" id="content">
          <header className="zn-doc__head">
            <p className="zn-postrow__cat">{article.category}</p>
            <h1 className="zn-doc__title">{article.title}</h1>
            <p className="zn-doc__lede">{article.lede}</p>
            <p className="zn-doc__updated">
              <time dateTime={article.publishedAt}>{article.published}</time>
              {` · ${toPersianDigits(article.readingMinutes)} دقیقه مطالعه`}
            </p>
          </header>

          <section className="zn-doc__block">
            {article.body.map((paragraph) => (
              <p className="zn-doc__para" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>

          <nav className="zn-doc__related" aria-label="مقاله‌های دیگر">
            <h2 className="zn-doc__heading">مقاله‌های دیگر</h2>
            <ul className="zn-doc__links">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link className="zn-doc__link" href={routes.article(other.slug)}>
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
