'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { CameraIcon } from '@/components/icons';
import { codeLabel, SELFIE_RULES } from '@/lib/account-view';

import { submitSelfie } from '../actions';
import type { SelfieDraft, StepState } from '../state';

const EMPTY: SelfieDraft = { acknowledged: false };

/**
 * The last step: the photograph, and the code that has to be in it.
 *
 * The upload slot is drawn and disabled. Accepting an image needs object
 * storage, a size and type check and a virus scan, and none of those exist —
 * a slot that silently swallows a file is worse than one that says it is not
 * ready, because the customer believes they have sent something.
 *
 * So what this form submits is the acknowledgement and the challenge, and the
 * account goes into review on the strength of that. When storage lands, the
 * slot becomes a file input and nothing else here changes.
 */
export function SelfieForm({ challenge }: { readonly challenge: string }) {
  const [state, submit] = useActionState<StepState<SelfieDraft>, FormData>(submitSelfie, {
    status: 'idle',
    draft: EMPTY,
  });

  const draft = state.status === 'idle' ? EMPTY : state.draft;
  const message = state.status === 'idle' ? undefined : state.message;

  return (
    <form className="zn-flow__form" action={submit}>
      <input type="hidden" name="challenge" value={challenge} />

      <div className="zn-flow__fields zn-flow__fields--tight">
        <p className="zn-challenge">
          <span className="zn-challenge__note">
            این عدد را روی کاغذ بنویسید و در تصویر نگه دارید
          </span>
          <span className="zn-challenge__code">{codeLabel(challenge)}</span>
        </p>

        <div className="zn-slot" aria-disabled="true">
          <span className="zn-slot__icon" aria-hidden="true">
            <CameraIcon size={30} />
          </span>
          <span className="zn-slot__label">ارسال تصویر هنوز فعال نیست</span>
          <span className="zn-slot__note">
            تا راه‌اندازی سرویس تصویر، درخواست شما با همین اطلاعات بررسی می‌شود.
          </span>
        </div>

        <ul className="zn-rules">
          {SELFIE_RULES.map((rule) => (
            <li className="zn-rules__item" key={rule}>
              <span className="zn-rules__dot" aria-hidden="true" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        <label className="zn-agree">
          <input
            className="zn-agree__input"
            type="checkbox"
            name="acknowledged"
            defaultChecked={draft.acknowledged}
          />
          <span className="zn-agree__text">
            قواعد بالا را خوانده‌ام و تصویر را مطابق آن‌ها ارسال می‌کنم.
          </span>
        </label>

        {message === undefined ? null : (
          <p className="zn-fld__help zn-fld__help--bad" role="alert">
            {message}
          </p>
        )}
      </div>

      <div className="zn-flow__foot">
        <SubmitButton className="zn-flow__go" pendingLabel="در حال ارسال…">
          ارسال برای بررسی
        </SubmitButton>
      </div>
    </form>
  );
}
