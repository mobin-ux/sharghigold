import { INSTALLMENT_QUOTE_MAX_TOMAN, INSTALLMENT_QUOTE_MIN_TOMAN } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { INSTALLMENT } from '@/config/commerce-terms';
import {
  instalmentCountLabel,
  instalmentDueLabel,
  millionsLabel,
  MONTHLY_SURCHARGE_LABEL,
  QUICK_AMOUNTS_TOMAN,
  termSurchargeLabel,
} from '@/lib/installment-view';

describe('instalment labels', () => {
  it('suggests only amounts the calculator accepts', () => {
    for (const amount of QUICK_AMOUNTS_TOMAN) {
      const toman = BigInt(amount);
      expect(toman >= INSTALLMENT_QUOTE_MIN_TOMAN && toman <= INSTALLMENT_QUOTE_MAX_TOMAN).toBe(
        true,
      );
    }
  });

  it('reads millions, counts and schedule rows in Persian', () => {
    expect(millionsLabel('60000000')).toBe('۶۰ میلیون');
    expect(instalmentCountLabel(12)).toBe('۱۲ قسط');
    expect(instalmentDueLabel(2, 12)).toBe('ماه ۳ از ۱۲');
  });

  it('derives what a term adds from the monthly rate', () => {
    expect(INSTALLMENT.monthlySurchargeBasisPoints).toBe(200);
    expect(termSurchargeLabel(6)).toBe('کارمزد ۱۲٪');
    expect(termSurchargeLabel(18)).toBe('کارمزد ۳۶٪');
    expect(MONTHLY_SURCHARGE_LABEL).toBe('۲٪ ماهانه');
  });
});
