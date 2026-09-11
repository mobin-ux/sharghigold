'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { InfoIcon } from '@/components/icons';

import { saveBank } from '../actions';
import type { BankDraft, StepState } from '../state';

/**
 * The account number money is returned to.
 *
 * The `IR` prefix is drawn beside the field rather than typed into it: it is
 * the same two letters for every Iranian account, and a customer who pastes a
 * number that already carries them should not have to delete them. The action
 * accepts either way and normalises.
 */
export function BankForm({ initial }: { readonly initial: BankDraft }) {
  const [state, submit] = useActionState<StepState<BankDraft>, FormData>(saveBank, {
    status: 'idle',
    draft: initial,
  });

  const draft = state.status === 'idle' ? initial : state.draft;
  const invalid = state.status === 'invalid' ? state.message : undefined;
  const blocked = state.status === 'blocked' ? state.message : undefined;

  return (
    <form className="zn-flow__form" action={submit}>
      <div className="zn-flow__fields">
        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-k-iban">
            شماره شبا
          </label>
          <div className={`zn-fld__box${invalid === undefined ? '' : ' zn-fld__box--bad'}`}>
            <span className="zn-fld__prefix" aria-hidden="true">
              IR
            </span>
            <input
              className="zn-fld__input zn-fld__input--iban"
              id="zn-k-iban"
              name="iban"
              inputMode="numeric"
              dir="ltr"
              maxLength={30}
              placeholder="۰۶۰ ۱۲۰ ۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۰"
              defaultValue={draft.iban}
              aria-invalid={invalid !== undefined}
              aria-describedby="zn-k-iban-help"
              required
            />
          </div>
          <p
            className={`zn-fld__help${invalid === undefined ? '' : ' zn-fld__help--bad'}`}
            id="zn-k-iban-help"
            aria-live="polite"
          >
            {invalid ?? '۲۴ رقم پس از IR'}
          </p>
        </div>

        <p className="zn-hint">
          <InfoIcon size={15} strokeWidth={1.8} />
          <span>
            حساب باید به نام خودتان باشد. بازگشت وجه و تسویه اقساط تنها به این حساب انجام می‌شود.
          </span>
        </p>

        {blocked === undefined ? null : (
          <p className="zn-fld__help zn-fld__help--bad" role="alert">
            {blocked}
          </p>
        )}
      </div>

      <div className="zn-flow__foot">
        <SubmitButton className="zn-flow__go" pendingLabel="در حال بررسی…">
          ادامه
        </SubmitButton>
      </div>
    </form>
  );
}
