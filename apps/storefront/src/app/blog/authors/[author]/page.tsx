import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BottomNav } from '@/components/bottom-nav';
import { ArticleRow } from '@/components/magazine/article-cards';
import { MagazineHeader } from '@/components/magazine/magazine-chrome';
import { SUPPORT } from '@/config/brand';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { articlesBy, findAuthor, listAuthors, topicById } from '@/server/content/magazine';

import '../../magazine.css';

type Params = Promise<{ readonly author: string }>;

export function generateStaticParams() {
  return listAuthors().map((author) => ({ author: author.slug }));
}

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const author = findAuthor((await params).author);

  if (author === undefined) return { title: 'نویسنده پیدا نشد' };

  return {
    title: author.name,
    description: author.bio,
    alternates: { canonical: routes.blogAuthor(author.slug) },
  };
}

/** A writer: who they are, what they cover, and everything they have written. */
export default async function AuthorPage({ params }: { readonly params: Params }) {
  const author = findAuthor((await params).author);

  if (author === undefined) notFound();

  const articles = articlesBy(author);

  return (
    <div className="zn-shell zn-shell--magazine">
      <MagazineHeader title="نویسنده" back={routes.blog()} />

      <main>
        <section className="zn-magauthor" aria-labelledby="author-name">
          <div className="zn-magauthor__row">
            <span className="zn-magavatar zn-magavatar--xl" aria-hidden="true">
              {author.initials}
            </span>
            <div className="zn-magauthor__who">
              <h1 className="zn-magauthor__name" id="author-name">
                {author.name}
              </h1>
              <span className="zn-magauthor__role">{author.role}</span>
              <span className="zn-magauthor__cred">{author.credential}</span>
            </div>
          </div>
          <p className="zn-magauthor__bio">{author.bio}</p>
          <ul className="zn-magstats zn-magstats--author">
            <li className="zn-magstats__item">
              <span className="zn-magstats__value">{persianCount(articles.length)}</span>
              <span className="zn-magstats__label">مقاله</span>
            </li>
            <li className="zn-magstats__item">
              <span className="zn-magstats__value">{persianCount(author.yearsInMarket)}</span>
              <span className="zn-magstats__label">سال در بازار</span>
            </li>
            <li className="zn-magstats__item">
              <span className="zn-magstats__value">{persianCount(author.specialties.length)}</span>
              <span className="zn-magstats__label">حوزه تخصصی</span>
            </li>
          </ul>
        </section>

        <section className="zn-magsec zn-magsec--specialties" aria-labelledby="specialties-title">
          <h2 className="zn-magsec__title zn-magsec__title--xs" id="specialties-title">
            تخصص‌ها
          </h2>
          <ul className="zn-magtags">
            {author.specialties.map((specialty) => (
              <li className="zn-magpill" key={specialty}>
                {specialty}
              </li>
            ))}
          </ul>
        </section>

        <section className="zn-magsec zn-magsec--writing" aria-labelledby="writing-title">
          <h2 className="zn-magsec__title zn-magsec__title--sub" id="writing-title">
            {`نوشته‌های ${author.name}`}
          </h2>
          <ul className="zn-maglist">
            {articles.map((article) => (
              <li key={article.slug}>
                <ArticleRow
                  article={article}
                  topicLabel={topicById(article.topic).label}
                  size={80}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="zn-magsec zn-magsec--end" aria-labelledby="ask-title">
          <div className="zn-magask">
            <h2 className="zn-magask__title" id="ask-title">
              پرسش خود را مستقیم بپرسید
            </h2>
            <p className="zn-magask__body">
              کارشناسان پشتیبانی زرنما پاسخ می‌دهند: <bdi dir="ltr">{SUPPORT.telephoneLabel}</bdi>
            </p>
            <Link className="zn-magbtn zn-magbtn--gold zn-magbtn--inline" href={routes.contact()}>
              تماس با پشتیبانی
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
