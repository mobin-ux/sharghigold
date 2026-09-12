import Link from 'next/link';

import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { routes } from '@/lib/routes';
import type { StaticPage } from '@/server/content/pages';

/**
 * One page that is text.
 *
 * Every editorial and policy page renders through this, so they read the
 * same and gain the same chrome — header, footer, tab bar — without eleven
 * routes each deciding for themselves.
 *
 * Content arrives as structured blocks, never as markup. A block is a heading
 * and some paragraphs; what element each becomes is this component's decision,
 * which is what keeps a content source from being able to put a `<script>` on
 * a reader's page.
 */
/** Stable, so an unrelated page does not get a new array on every render. */
const NO_RELATED: readonly { readonly title: string; readonly href: string }[] = [];

export function ContentPageView({
  page,
  related = NO_RELATED,
}: {
  readonly page: StaticPage;
  /** Sibling pages, offered at the foot so a reader is not left at a dead end. */
  readonly related?: readonly { readonly title: string; readonly href: string }[];
}) {
  return (
    <>
      <a className="skip-link" href="#content">
        رفتن به متن صفحه
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <main className="zn-doc" id="content">
          <header className="zn-doc__head">
            <h1 className="zn-doc__title">{page.title}</h1>
            <p className="zn-doc__lede">{page.lede}</p>
            <p className="zn-doc__updated">{`آخرین بازبینی: ${page.updated}`}</p>
          </header>

          {page.blocks.map((block, index) => (
            <section
              className="zn-doc__block"
              // Headings repeat across pages and a block may have none, so the
              // index is the only stable identity here.
              key={`${page.slug}-${String(index)}`}
            >
              {block.heading === null ? null : <h2 className="zn-doc__heading">{block.heading}</h2>}

              {(block.paragraphs ?? []).map((paragraph) => (
                <p className="zn-doc__para" key={paragraph}>
                  {paragraph}
                </p>
              ))}

              {block.bullets === undefined ? null : (
                <ul className="zn-doc__list">
                  {block.bullets.map((bullet) => (
                    <li className="zn-doc__item" key={bullet}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {related.length === 0 ? null : (
            <nav className="zn-doc__related" aria-label="صفحه‌های مرتبط">
              <h2 className="zn-doc__heading">بیشتر بخوانید</h2>
              <ul className="zn-doc__links">
                {related.map((item) => (
                  <li key={item.href}>
                    <Link className="zn-doc__link" href={item.href}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className="zn-doc__foot">
            پاسخ سؤالتان را پیدا نکردید؟{' '}
            <Link className="zn-doc__link" href={routes.contact()}>
              با پشتیبانی تماس بگیرید
            </Link>
          </p>
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
