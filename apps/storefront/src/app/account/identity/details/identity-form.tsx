'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';

import { saveIdentity } from '../actions';
import type { IdentityDraft, StepState } from '../state';

/**
 * The national ID and the birth date.
 *
 * Both fields are `dir="ltr"` and set in the tabular price face, because both
 * are read digit by digit and a proportional face makes a ten-digit number
 * hard to check against a card.
 *
 * The help line under each field carries the rule before the mistake and the
 * message after it, in the same place — a customer who has just been told
 * «۱۰ رقم» should not have to look somewhere else to find out what went wrong.
 */
export function IdentityForm({ initial }: { readonly initial: IdentityDraft }) {
  const [state, submit] = useActionState<StepState<IdentityDraft>, FormData>(saveIdentity, {
    status: 'idle',
    draft: initial,
  });

  const draft = state.status === 'idle' ? initial : state.draft;
  const invalid = state.status === 'invalid' ? state : undefined;
  const blocked = state.status === 'blocked' ? state.message : undefined;

  return (
    <form className="zn-flow__form" action={submit}>
      <div className="zn-flow__fields">
        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-k-nid">
            کد ملی
          </label>
          <div
            className={`zn-fld__box${invalid?.field === 'nationalId' ? ' zn-fld__box--bad' : ''}`}
          >
            <input
              className="zn-fld__input zn-fld__input--code"
              id="zn-k-nid"
              name="nationalId"
              inputMode="numeric"
              dir="ltr"
              maxLength={10}
              placeholder="۰۰۱۲۳۴۵۶۷۸"
              defaultValue={draft.nationalId}
              aria-invalid={invalid?.field === 'nationalId'}
              aria-describedby="zn-k-nid-help"
              required
            />
          </div>
          <p
            className={`zn-fld__help${invalid?.field === 'nationalId' ? ' zn-fld__help--bad' : ''}`}
            id="zn-k-nid-help"
            aria-live="polite"
          >
            {invalid?.field === 'nationalId' ? invalid.message : 'بدون خط تیره وارد کنید.'}
          </p>
        </div>

        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-k-birth">
            تاریخ تولد
          </label>
          <div
            className={`zn-fld__box${invalid?.field === 'birthDate' ? ' zn-fld__box--bad' : ''}`}
          >
            <input
              className="zn-fld__input zn-fld__input--code"
              id="zn-k-birth"
              name="birthDate"
              inputMode="numeric"
              dir="ltr"
              maxLength={10}
              placeholder="۱۳۷۰/۰۵/۱۲"
              defaultValue={draft.birthDate}
              aria-invalid={invalid?.field === 'birthDate'}
              aria-describedby="zn-k-birth-help"
              required
            />
          </div>
          <p
            className={`zn-fld__help${invalid?.field === 'birthDate' ? ' zn-fld__help--bad' : ''}`}
            id="zn-k-birth-help"
            aria-live="polite"
          >
            {invalid?.field === 'birthDate'
              ? invalid.message
              : 'همان‌طور که در شناسنامه ثبت شده است.'}
          </p>
        </div>

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
