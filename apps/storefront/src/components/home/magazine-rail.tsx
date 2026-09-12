import Link from 'next/link';

import { toPersianDigits } from '@sharghigold/ui';

import { SectionHeader } from '@/components/home/section-header';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { routes } from '@/lib/routes';
import type { Article } from '@/server/content/magazine';

/**
 * The magazine rail.
 *
 * The date and reading time are separate elements rather than one
 * «۱۲ مرداد ۱۴۰۵ · ۹ دقیقه مطالعه» string. The dot between them is
 * bidi-neutral: inside a single RTL text run bracketed by numerals it attaches
 * to the wrong side, and the date and the reading time visually merge into one
 * wrong number.
 */
export function MagazineRail({ articles }: { readonly articles: readonly Article[] }) {
  return (
    <section
      className="zn-rail-section zn-rail-section--magazine"
      aria-labelledby="magazine-heading"
    >
      <SectionHeader
        id="magazine-heading"
        title="مجله زرنما"
        href={routes.blog()}
        linkLabel="همه مقاله‌ها"
        link="plain"
        gap={4}
      />
      <p className="zn-section__lede zn-section__lede--inset zn-section__lede--magazine">
        راهنمای خرید و تحلیل بازار، نوشته کارشناسان زرنما
      </p>

      <ul className="zn-rail zn-rail--flush" tabIndex={0} aria-labelledby="magazine-heading">
        {articles.map((article) => (
          <li className="zn-rail__item zn-rail__item--wide" key={article.slug}>
            <article className="zn-post">
              <div className="zn-post__media" aria-hidden="true">
                <MediaPlaceholder label="تصویر مقاله" />
              </div>
              <div className="zn-post__body">
                <span className="zn-post__cat">{article.category}</span>
                <h3 className="zn-post__title">
                  <Link className="zn-post__link" href={routes.article(article.slug)}>
                    {article.title}
                  </Link>
                </h3>
                <p className="zn-post__meta">
                  <span>{article.published}</span>
                  <span aria-hidden="true">·</span>
                  <span>{`${toPersianDigits(article.readingMinutes)} دقیقه مطالعه`}</span>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
