/**
 * What an instalment purchase costs.
 *
 * One implementation, used by the product page's «قسط ماهانه» preview and by
 * the checkout screen that actually takes the deposit. The alternative — a
 * preview that divides and a checkout that amortises — is a shop that
 * advertises one monthly figure and charges another.
 *
 * Every step is integer arithmetic on `Rials`. The deposit and the surcharge
 * are basis-point rates from `shop-policy`, so no percentage becomes a float,
 * and the instalments are allocated rather than rounded individually: the
 * parts add back to the financed amount exactly, and the largest is quoted so
 * a customer is never asked for more than the number they were shown.
 *
 * Server-only and pure. `now` never enters it — an offer is a function of an
 * amount and the shop's terms, nothing else.
 */
import type { InstallmentOffer } from '@sharghigold/contracts';
import {
  addRials,
  allocateRials,
  RIALS_PER_TOMAN,
  roundTotalToStep,
  scaleRialsByBasisPoints,
  subtractRials,
  sumRials,
  type Rials,
} from '@sharghigold/money';

import { INSTALLMENT } from './shop-policy';

export interface InstallmentBreakdown {
  readonly months: number;
  readonly deposit: Rials;
  /** What is spread over the term, before the surcharge. */
  readonly financed: Rials;
  /** The instalments, in order. They sum to `financed` plus the surcharge. */
  readonly instalments: readonly Rials[];
  /** The largest instalment, rounded up to a whole toman. What is quoted. */
  readonly monthly: Rials;
  /** Deposit plus every instalment: what the purchase costs in the end. */
  readonly total: Rials;
}

/**
 * Price one term against a cash total.
 *
 * The surcharge applies to the financed balance and is scaled by the length of
 * the term, so a longer term costs more — which is the whole of the
 * arrangement and the part a customer is entitled to see stated.
 */
export function priceInstallment(cashTotal: Rials, months: number): InstallmentBreakdown {
  if (!Number.isSafeInteger(months) || months < 1) {
    throw new RangeError(`instalment term must be a positive integer, received ${String(months)}`);
  }

  const deposit = scaleRialsByBasisPoints(cashTotal, INSTALLMENT.depositBasisPoints);
  const financed = subtractRials(cashTotal, deposit);
  const surcharge = scaleRialsByBasisPoints(
    financed,
    INSTALLMENT.monthlySurchargeBasisPoints * months,
  );
  const repayable = addRials(financed, surcharge);

  const instalments = allocateRials(
    repayable,
    Array.from({ length: months }, () => 1n),
  );

  // The quoted figure is the largest part rounded up to a whole toman, the
  // unit it is displayed in. Rounding down would leave the final instalment
  // short of the balance — the shop's rounding error to absorb, not the
  // customer's to discover.
  const largest = instalments.reduce((most, part) => (part > most ? part : most), 0n as Rials);

  return {
    months,
    deposit,
    financed,
    instalments,
    monthly: roundTotalToStep(largest, RIALS_PER_TOMAN, 'ceil'),
    total: addRials(deposit, sumRials(instalments)),
  };
}

/** Every term the shop offers, priced against one cash total. */
export function installmentOffers(cashTotal: Rials): readonly InstallmentOffer[] {
  return INSTALLMENT.terms.map((months) => {
    const priced = priceInstallment(cashTotal, months);

    return {
      months,
      depositRials: priced.deposit.toString(),
      monthlyRials: priced.monthly.toString(),
      totalRials: priced.total.toString(),
    };
  });
}
