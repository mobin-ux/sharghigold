'use server';

import {
  ageInYears,
  kycBankSchema,
  kycIdentitySchema,
  kycSelfieSchema,
} from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import {
  restartVerification,
  saveBankStep,
  saveIdentityStep,
  submitSelfieStep,
} from '@/server/account/account';
import { consume } from '@/server/account/rate-limit';
import { requireViewer } from '@/server/account/session';

import type { BankDraft, IdentityDraft, SelfieDraft, StepState } from './state';

/** The age at which a person may enter a credit agreement. */
const ADULT_AGE = 18;

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Begin, or begin again after a refusal. */
export async function startVerification(): Promise<void> {
  const viewer = await requireViewer();
  restartVerification(viewer);
  redirect('/account/identity/details');
}

/* -------------------------------------------------------------------------- */
/* Step one                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Who you are.
 *
 * Both values are checked for more than their shape. The national ID has to
 * satisfy its check digit, and the birth date has to be a day that exists in
 * the Iranian calendar and to put the customer over eighteen — verification
 * exists so that instalment credit can be extended, and credit to a minor is
 * not a form-validation question.
 */
export async function saveIdentity(
  _previous: StepState<IdentityDraft>,
  form: FormData,
): Promise<StepState<IdentityDraft>> {
  const viewer = await requireViewer();

  const draft: IdentityDraft = {
    nationalId: toLatinDigits(read(form, 'nationalId')),
    birthDate: toLatinDigits(read(form, 'birthDate')).replace(/[-.]/g, '/'),
  };

  const budget = consume('kyc:submit', viewer.customer.id);
  if (!budget.allowed) {
    return {
      status: 'blocked',
      message: 'تلاش بیش از حد مجاز بود. بعداً دوباره تلاش کنید.',
      draft,
    };
  }

  const parsed = kycIdentitySchema.safeParse(draft);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: 'invalid',
      message: first?.message ?? 'اطلاعات هویتی پذیرفته نشد.',
      field: first?.path[0] === 'birthDate' ? 'birthDate' : 'nationalId',
      draft,
    };
  }

  if (ageInYears(parsed.data.birthDate, new Date()) < ADULT_AGE) {
    return {
      status: 'invalid',
      message: 'خرید اقساطی تنها برای افراد بالای ۱۸ سال امکان‌پذیر است.',
      field: 'birthDate',
      draft,
    };
  }

  saveIdentityStep(viewer, parsed.data.nationalId, parsed.data.birthDate);
  redirect('/account/identity/bank');
}

/* -------------------------------------------------------------------------- */
/* Step two                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Where money goes back to.
 *
 * The IBAN's own check digits are verified, so a transposed pair is caught
 * here rather than by a refund arriving in a stranger's account.
 */
export async function saveBank(
  _previous: StepState<BankDraft>,
  form: FormData,
): Promise<StepState<BankDraft>> {
  const viewer = await requireViewer();
  const draft: BankDraft = { iban: toLatinDigits(read(form, 'iban')) };

  const budget = consume('kyc:submit', viewer.customer.id);
  if (!budget.allowed) {
    return {
      status: 'blocked',
      message: 'تلاش بیش از حد مجاز بود. بعداً دوباره تلاش کنید.',
      draft,
    };
  }

  const parsed = kycBankSchema.safeParse({ iban: `IR${draft.iban.replace(/^IR/, '')}` });
  if (!parsed.success) {
    return {
      status: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'شماره شبا پذیرفته نشد.',
      field: 'iban',
      draft,
    };
  }

  saveBankStep(viewer, parsed.data.iban);
  redirect('/account/identity/selfie');
}

/* -------------------------------------------------------------------------- */
/* Step three                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The photograph, and the account into review.
 *
 * The challenge the form returns is compared against the one on file. It is
 * not a secret and the comparison is not authentication — it is what stops a
 * form submitted from a tab left open overnight being counted against a code
 * that has since been reissued.
 */
export async function submitSelfie(
  _previous: StepState<SelfieDraft>,
  form: FormData,
): Promise<StepState<SelfieDraft>> {
  const viewer = await requireViewer();
  const draft: SelfieDraft = { acknowledged: form.get('acknowledged') === 'on' };

  const budget = consume('kyc:submit', viewer.customer.id);
  if (!budget.allowed) {
    return {
      status: 'blocked',
      message: 'تلاش بیش از حد مجاز بود. بعداً دوباره تلاش کنید.',
      draft,
    };
  }

  const parsed = kycSelfieSchema.safeParse({
    challenge: toLatinDigits(read(form, 'challenge')),
    acknowledged: draft.acknowledged ? true : undefined,
  });

  if (!parsed.success) {
    return {
      status: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'ارسال تصویر پذیرفته نشد.',
      field: 'acknowledged',
      draft,
    };
  }

  const result = submitSelfieStep(viewer, parsed.data.challenge, new Date());

  if (result.status === 'stale') {
    return {
      status: 'blocked',
      message: 'کد نمایش‌داده‌شده تازه‌سازی شده است. صفحه را دوباره باز کنید.',
      draft,
    };
  }

  redirect('/account/identity?done=kyc-submitted');
}
