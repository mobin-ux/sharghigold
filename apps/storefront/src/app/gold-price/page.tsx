import type { Metadata } from 'next';
import Link from 'next/link';
import { PriceTicker } from '@sharghigold/ui';
import {
  formatToman,
  gramsToMilligrams,
  pricePerGramForKarat,
  quoteGoldPrice,
} from '@sharghigold/money';
import { toPersianDigits } from '@sharghigold/ui';

import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { CATALOGUE_RATES } from '@/config/commerce-terms';
import { getGoldRate } from '@/lib/gold-price';
import { routes } from '@/lib/routes';
import { buildTicker } from '@/lib/ticker';

import '../doc.css';
import './gold-price.css';

export const metadata: Metadata = {
  title: 'قیمت لحظه‌ای طلا',
  description: 'نرخ روز طلای ۱۸، ۲۱ و ۲۴ عیار، و توضیح اینکه قیمت یک قطعه چطور از آن ساخته می‌شود.',
  alternates: { canonical: '/gold-price' },
};

/** The purities the shop quotes a gram price for. */
const KARATS = [18, 21, 22, 24] as const;

/** The weight the worked example is written against. */
const EXAMPLE_GRAMS = '5';

/**
 * The gold rate, and what it means for a price on a product page.
 *
 * The footer has linked here since the footer was written. What makes the page
 * worth having rather than a second ticker is the second half: a customer
 * comparing «۱۰٬۴۸۰٬۰۰۰ تومان در گرم» with a ring priced at four times its
 * weight wants to know where the difference went, and the answer — اجرت, سود,
 * مالیات — is the shop's to state plainly.
 *
 * Every figure is computed from the same `getGoldRate()` the product cards are
 * priced from. A page that quoted its own rate would be a page that disagrees
 * with the catalogue, which is the whole reason this file computes rather than
 * lists.
 */
export default function GoldPricePage() {
  const rate = getGoldRate();
  const ticker = buildTicker();

  return (
    <>
      <a className="skip-link" href="#content">
        رفتن به نرخ‌ها
      </a>

      <div className="zn-shell">
        <SiteHeader />

        <PriceTicker
          items={ticker.items}
          label="قیمت لحظه‌ای"
          asOf={`آخرین به‌روزرسانی: ${ticker.asOf}`}
        />

        <main className="zn-doc" id="content">
          <header className="zn-doc__head">
            <h1 className="zn-doc__title">قیمت لحظه‌ای طلا</h1>
            <p className="zn-doc__lede">
              نرخ هر گرم طلا بر اساس عیار، و توضیح اینکه قیمت یک قطعه چطور از این نرخ ساخته می‌شود.
            </p>
            <p className="zn-doc__updated">{`آخرین به‌روزرسانی: ${rate.asOf}`}</p>
          </header>

          {rate.isLive ? null : (
            // Stated, not hidden. Showing a stale rate as if it were current is
            // how a shop ends up honouring yesterday's price on today's metal.
            <p className="zn-rate__stale" role="status">
              این نرخ از آخرین مظنه ثبت‌شده خوانده می‌شود و هنوز به فید زنده بازار وصل نیست. قیمت هر
              سفارش در لحظه ثبت، دوباره و از نرخ همان لحظه محاسبه می‌شود.
            </p>
          )}

          <section className="zn-doc__block">
            <h2 className="zn-doc__heading">نرخ هر گرم بر اساس عیار</h2>

            <table className="zn-ratetable">
              <thead>
                <tr>
                  <th scope="col">عیار</th>
                  <th scope="col">قیمت هر گرم</th>
                </tr>
              </thead>
              <tbody>
                {KARATS.map((karat) => (
                  <tr key={karat}>
                    <th scope="row">{`${toPersianDigits(karat)} عیار`}</th>
                    <td>
                      {formatToman(
                        pricePerGramForKarat(rate.pricePerGram18k, rate.quotedKarat, karat),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="zn-doc__para">
              نرخ عیارهای دیگر از نرخ ۱۸ عیار و نسبت خلوص آن‌ها محاسبه می‌شود، نه از یک جدول جداگانه
              — بنابراین با تغییر نرخ پایه، همه ردیف‌ها با هم حرکت می‌کنند.
            </p>
          </section>

          <section className="zn-doc__block">
            <h2 className="zn-doc__heading">قیمت یک قطعه چطور ساخته می‌شود</h2>

            <ol className="zn-ratesteps">
              <li>
                <span className="zn-ratesteps__key">ارزش طلا</span>
                <span className="zn-ratesteps__val">وزن × نرخ روز</span>
              </li>
              <li>
                <span className="zn-ratesteps__key">اجرت ساخت</span>
                <span className="zn-ratesteps__val">درصدی از ارزش طلا، بسته به طرح</span>
              </li>
              <li>
                <span className="zn-ratesteps__key">سود فروشنده</span>
                <span className="zn-ratesteps__val">
                  {`${toPersianDigits(CATALOGUE_RATES.profitBasisPoints / 100)}٪ از ارزش طلا و اجرت`}
                </span>
              </li>
              <li>
                <span className="zn-ratesteps__key">مالیات بر ارزش افزوده</span>
                <span className="zn-ratesteps__val">
                  {`${toPersianDigits(CATALOGUE_RATES.vatBasisPoints / 100)}٪ — فقط روی اجرت و سود`}
                </span>
              </li>
            </ol>

            <p className="zn-doc__para">
              مالیات به خود طلا تعلق نمی‌گیرد؛ تنها اجرت و سود مشمول آن هستند. به همین دلیل تخفیف هم
              همیشه روی اجرت است — نه روی طلا، که به اندازه طلاست.
            </p>

            <p className="zn-doc__para">
              {`برای نمونه، یک قطعه ${toPersianDigits(EXAMPLE_GRAMS)} گرمی ۱۸ عیار امروز ارزش طلایی برابر با `}
              {/* Quoted through the money package with every fee at zero,
                  rather than multiplied here. Nothing outside that package
                  does arithmetic on an amount, so an example on a page cannot
                  quietly round differently from a price in a basket. */}
              {formatToman(
                quoteGoldPrice({
                  pricePerGram: pricePerGramForKarat(rate.pricePerGram18k, rate.quotedKarat, 18),
                  weight: gramsToMilligrams(EXAMPLE_GRAMS),
                  makingFeeBasisPoints: 0,
                  profitBasisPoints: 0,
                  vatBasisPoints: 0,
                }).goldValue,
              )}
              {' دارد؛ مبلغ نهایی فاکتور از این عدد بیشتر است و تفاوت، همان سه ردیف بالاست.'}
            </p>
          </section>

          <nav className="zn-doc__related" aria-label="صفحه‌های مرتبط">
            <h2 className="zn-doc__heading">بیشتر بخوانید</h2>
            <ul className="zn-doc__links">
              <li>
                <Link className="zn-doc__link" href={routes.help('faq')}>
                  سؤالات متداول درباره قیمت
                </Link>
              </li>
              <li>
                <Link className="zn-doc__link" href={routes.article('gold-price-outlook')}>
                  تحلیل بازار طلا
                </Link>
              </li>
              <li>
                <Link className="zn-doc__link" href={routes.products({ sort: 'price-asc' })}>
                  ارزان‌ترین کالاهای موجود
                </Link>
              </li>
            </ul>
          </nav>
        </main>

        <SiteFooter />
        <BottomNav />
      </div>
    </>
  );
}
