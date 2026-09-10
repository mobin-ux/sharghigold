import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AskForm } from '@/components/product/ask-form';
import { ProductChrome } from '@/components/product/product-chrome';
import { persianCount, relativeTime } from '@/lib/product-view';
import { getProduct } from '@/server/catalogue/product';
import { getProductQuestions } from '@/server/catalogue/questions';
import { SELLER } from '@/server/policy/shop-policy';

import '../product.css';
import '../reviews/reviews.css';
import './questions.css';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);

  if (product === undefined) return { title: 'کالا پیدا نشد' };

  return {
    title: `پرسش و پاسخ — ${product.title}`,
    description: `پرسش‌های خریداران درباره ${product.title} و پاسخ کارشناسان زرنما.`,
    alternates: { canonical: `/products/${product.slug}/questions` },
  };
}

/**
 * «پرسش و پاسخ» — what buyers asked, and what the shop answered.
 *
 * Its own page, and server-rendered, because these are the exact sentences
 * people type into a search engine before buying. A question that only exists
 * after a tab is clicked is a question nobody finds.
 */
export default async function ProductQuestionsPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (product === undefined) notFound();

  const questions = await getProductQuestions(slug);
  const now = new Date();

  return (
    <>
      <a className="skip-link" href="#questions">
        رفتن به پرسش‌ها
      </a>

      <div className="zn-shell zn-shell--product">
        <ProductChrome title="پرسش و پاسخ" backHref={`/products/${slug}`} />

        <main className="zn-subpage">
          <section className="zn-subhead">
            <h1 className="zn-subhead__title">پرسش و پاسخ</h1>
            <p className="zn-subhead__body">
              پرسش‌های خریداران درباره {product.title} و پاسخ کارشناسان زرنما.
            </p>
          </section>

          <section className="zn-qalist" id="questions" aria-label="پرسش‌های خریداران">
            {questions.map((entry) => (
              <article className="zn-qa" key={entry.id}>
                <div className="zn-qa__row">
                  <span className="zn-qa__mark zn-qa__mark--q" aria-hidden="true">
                    پ
                  </span>
                  <h2 className="zn-qa__question">{entry.body}</h2>
                </div>

                {entry.answer === null ? (
                  <p className="zn-qa__pending">هنوز پاسخی ثبت نشده است.</p>
                ) : (
                  <div className="zn-qa__row zn-qa__row--answer">
                    <span className="zn-qa__mark zn-qa__mark--a" aria-hidden="true">
                      {SELLER.initial}
                    </span>
                    <p className="zn-qa__answer">{entry.answer.body}</p>
                  </div>
                )}

                <div className="zn-qa__meta">
                  <span>
                    پرسش از {entry.askedByDisplayName} · {relativeTime(entry.askedAt, now)}
                  </span>
                  {entry.helpfulCount > 0 ? (
                    <span className="zn-qa__useful">
                      {persianCount(entry.helpfulCount)} نفر این پاسخ را مفید دانستند
                    </span>
                  ) : null}
                </div>
              </article>
            ))}

            {questions.length === 0 ? (
              <p className="zn-qa__empty">
                هنوز پرسشی درباره این کالا ثبت نشده است. اولین پرسش را شما بپرسید.
              </p>
            ) : null}
          </section>

          <section className="zn-askwrap">
            <AskForm slug={slug} />

            <div className="zn-consult">
              <p className="zn-consult__text">
                پاسخ فوری می‌خواهید؟ کارشناسان ما روزهای کاری ۹ تا ۱۸ پاسخگو هستند.
              </p>
              <Link className="zn-consult__cta" href="/contact">
                تماس تلفنی
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
