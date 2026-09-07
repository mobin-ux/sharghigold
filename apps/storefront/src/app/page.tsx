import {
  formatGrams,
  formatToman,
  gramsToMilligrams,
  quoteGoldPrice,
  rials,
} from '@sharghigold/money';

import { SpecList } from '@/components/spec-list';
import { BRAND } from '@/config/brand';

/**
 * Foundation check page.
 *
 * This is not the homepage — it exists to prove the pieces are actually wired
 * together end to end: the token layer renders, RTL resolves, and the money
 * package produces correct Persian output.
 *
 * It is a Server Component on purpose. `Rials` is a bigint, which cannot cross
 * the server/client boundary, and it must not: prices are formatted where they
 * are computed, and only strings reach the browser. That is the pattern every
 * price in this application will follow.
 */
export default function FoundationPage(): React.ReactElement {
  // The reference case from the design: 18-carat at ۱۰٬۴۸۰٬۰۰۰ تومان per gram,
  // on a 1.8g piece, with a 15% making fee, 7% profit and 10% VAT.
  const weight = gramsToMilligrams('1.8');
  const quote = quoteGoldPrice({
    pricePerGram: rials(104_800_000n),
    weight,
    makingFeeBasisPoints: 1_500,
    profitBasisPoints: 700,
    vatBasisPoints: 1_000,
  });

  const lines = [
    { label: 'ارزش طلا', value: quote.goldValue },
    { label: 'اجرت', value: quote.makingFee },
    { label: 'سود', value: quote.profit },
    { label: 'مالیات بر ارزش افزوده', value: quote.vat },
  ] as const;

  return (
    <>
      <a className="skip-link" href="#main">
        رفتن به محتوای اصلی
      </a>

      <main className="page" id="main">
        <header style={{ marginBlockEnd: 'var(--space-6)' }}>
          <h1>{BRAND.name}</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{BRAND.tagline}</p>
        </header>

        <section
          aria-labelledby="quote-heading"
          style={{
            background: 'var(--color-surface)',
            border: 'var(--border-1) solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-sm)',
            padding: 'var(--space-inset-lg)',
          }}
        >
          <h2 id="quote-heading" style={{ fontSize: 'var(--fs-h4)' }}>
            نمونه محاسبه قیمت
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--fs-body-sm)' }}>
            <SpecList items={['گردنبند', '۱۸ عیار', formatGrams(weight)]} />
          </p>

          <dl style={{ marginBlockStart: 'var(--space-4)' }}>
            {lines.map((line) => (
              <div
                key={line.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  paddingBlock: 'var(--space-2)',
                  borderBlockEnd: 'var(--border-1) solid var(--color-divider)',
                }}
              >
                <dt style={{ color: 'var(--color-text-secondary)' }}>{line.label}</dt>
                <dd className="price" style={{ margin: 0 }}>
                  {formatToman(line.value)}
                </dd>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                paddingBlockStart: 'var(--space-4)',
              }}
            >
              <dt style={{ fontWeight: 'var(--fw-bold)' }}>مبلغ نهایی</dt>
              <dd
                className="price"
                style={{ margin: 0, fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)' }}
              >
                {formatToman(quote.total)}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
}
