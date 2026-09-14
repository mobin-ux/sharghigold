import { describe, expect, it } from 'vitest';

import {
  CALCULATOR_COPY,
  INSTALLMENT_COSTS,
  INSTALLMENT_HERO,
  INSTALLMENT_STEPS,
  installmentFaqs,
} from '@/server/content/installment-copy';

/**
 * The instalment page's words must describe the terms checkout honours. The
 * canvas it was drawn from advertised other ones, so the checks below pin the
 * copy to the configured terms rather than to any particular sentence.
 */
const everything = (): string =>
  JSON.stringify([
    INSTALLMENT_HERO,
    CALCULATOR_COPY,
    INSTALLMENT_STEPS,
    INSTALLMENT_COSTS,
    installmentFaqs(['انگشتر', 'النگو']),
  ]);

describe('instalment copy', () => {
  it('states the configured deposit, surcharge and longest term', () => {
    const text = everything();

    expect(text).toContain('۴۰٪');
    expect(text).toContain('۲٪ ماهانه');
    expect(text).toContain('تا ۱۸ ماه');
  });

  it('promises none of the canvas terms the shop does not offer', () => {
    const text = everything();

    for (const claim of ['۳۶ ماه', 'تأیید آنی', 'بدون جریمه', 'شورای پول']) {
      expect(text).not.toContain(claim);
    }
  });

  it('names the eligible categories from the taxonomy it is given', () => {
    const answer = installmentFaqs(['انگشتر', 'النگو', 'سکه']).find((entry) =>
      entry.question.includes('چه کالاهایی'),
    );

    expect(answer?.answer.startsWith('انگشتر، النگو و سکه.')).toBe(true);
    expect(
      installmentFaqs([]).find((entry) => entry.question.includes('چه کالاهایی'))?.answer,
    ).toContain('موجود نیست');
  });

  it('only calls delivery free above the checkout threshold', () => {
    const delivery = INSTALLMENT_COSTS.find((row) => row.label.includes('ارسال'));

    expect(delivery?.value).toBe('رایگان بالای ۲۰ میلیون تومان');
  });
});
