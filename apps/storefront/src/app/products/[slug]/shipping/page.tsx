import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatToman } from '@sharghigold/money';

import { TickIcon } from '@/components/icons';
import { PolicyIcon } from '@/components/product/policy-icon';
import { ProductChrome } from '@/components/product/product-chrome';
import { getProduct } from '@/server/catalogue/product';
import {
  RETURN_RULES,
  RETURN_VALUATION_NOTE,
  SHIPPING_OPTIONS,
  WARRANTY_POINTS,
} from '@/server/policy/shop-policy';

import '../product.css';
import '../reviews/reviews.css';
import './shipping.css';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);

  if (product === undefined) return { title: 'کالا پیدا نشد' };

  return {
    title: `ارسال، مرجوعی و ضمانت — ${product.title}`,
    description: 'شرایط تحویل، بازگشت کالا و ضمانت اصالت خرید از زرنما.',
    alternates: { canonical: `/products/${product.slug}/shipping` },
  };
}

/**
 * Delivery, returns and the authenticity guarantee.
 *
 * All of it is shop policy rather than product data, so it comes from one
 * module and reads the same under every piece in the catalogue. The page is
 * per-product only so that «back» returns to the ring the customer was looking
 * at, and so the terms can be linked to from the piece they were read against.
 *
 * The courier fee is a rial amount formatted here, not a string someone typed
 * with the digits already grouped.
 */
export default async function ProductShippingPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (product === undefined) notFound();

  return (
    <>
      <a className="skip-link" href="#delivery">
        رفتن به شرایط ارسال
      </a>

      <div className="zn-shell zn-shell--product">
        <ProductChrome title="ارسال، مرجوعی و ضمانت" backHref={`/products/${slug}`} />

        <main className="zn-subpage">
          <section className="zn-subhead">
            <h1 className="zn-subhead__title">ارسال، مرجوعی و ضمانت</h1>
            <p className="zn-subhead__body">شرایط تحویل و بازگشت این کالا.</p>
          </section>

          <section className="zn-ship" id="delivery" aria-label="روش‌های ارسال">
            {SHIPPING_OPTIONS.map((option) => (
              <article className="zn-ship__card" key={option.title}>
                <span className="zn-ship__mark">
                  <PolicyIcon icon={option.icon} />
                </span>
                <span className="zn-ship__text">
                  <span className="zn-ship__title">{option.title}</span>
                  <span className="zn-ship__desc">{option.description}</span>
                </span>
                <span className="zn-ship__cost">
                  {option.costRials === null ? 'رایگان' : formatToman(option.costRials)}
                </span>
              </article>
            ))}
          </section>

          <section className="zn-returns" aria-labelledby="returns">
            <h2 className="zn-returns__title" id="returns">
              شرایط مرجوعی
            </h2>

            <ul className="zn-returns__list">
              {RETURN_RULES.map((rule) => (
                <li className="zn-returns__row" key={rule.text}>
                  <span
                    className={`zn-returns__mark${rule.allowed ? '' : ' zn-returns__mark--no'}`}
                    aria-hidden="true"
                  >
                    {rule.allowed ? '✓' : '✕'}
                  </span>
                  <span className="zn-returns__text">
                    <span className="sr-only">
                      {rule.allowed ? 'پذیرفته می‌شود: ' : 'پذیرفته نمی‌شود: '}
                    </span>
                    {rule.text}
                  </span>
                </li>
              ))}
            </ul>

            <p className="zn-returns__note">{RETURN_VALUATION_NOTE}</p>
          </section>

          <section className="zn-warranty" aria-labelledby="warranty">
            <h2 className="zn-warranty__title" id="warranty">
              ضمانت اصالت
            </h2>

            <ul className="zn-warranty__list">
              {WARRANTY_POINTS.map((point) => (
                <li className="zn-warranty__row" key={point}>
                  <span className="zn-warranty__tick" aria-hidden="true">
                    <TickIcon size={16} strokeWidth={2.1} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="zn-help">
            <div className="zn-help__card">
              <h2 className="zn-help__title">هنوز سؤالی دارید؟</h2>
              <p className="zn-help__body">
                پیش از خرید، شرایط ارسال و مرجوعی را با کارشناسان ما بررسی کنید.
              </p>
              <div className="zn-help__actions">
                <Link className="zn-help__primary" href={`/products/${slug}/questions`}>
                  پرسش و پاسخ
                </Link>
                <Link className="zn-help__secondary" href="/contact">
                  مشاوره تلفنی
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
