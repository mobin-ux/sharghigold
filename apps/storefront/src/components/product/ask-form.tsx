'use client';

import { useActionState, useId } from 'react';
import { QUESTION_BODY_MAX } from '@sharghigold/contracts';

import { TickIcon } from '@/components/icons';
import { askQuestion, type AskState } from '@/app/products/[slug]/questions/actions';

/**
 * «پرسش خود را بپرسید».
 *
 * A real `<form>` with a Server Action, so it works before hydration and
 * without JavaScript. The field keeps what was typed when the action comes
 * back with an error, which is the difference between correcting a sentence
 * and writing it again.
 *
 * The three outcomes the design needs are all here: the form, the error, and
 * the confirmation. The fourth — «we cannot take this right now» — exists
 * because submissions have nowhere to go until the API does, and saying so is
 * better than a confirmation that means nothing.
 */
export function AskForm({ slug }: { readonly slug: string }) {
  const [state, action, pending] = useActionState<AskState, FormData>(askQuestion, {
    status: 'idle',
  });
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  if (state.status === 'accepted') {
    return (
      <div className="zn-ask__done">
        <span className="zn-ask__tick" aria-hidden="true">
          <TickIcon size={19} strokeWidth={2.2} />
        </span>
        <span className="zn-ask__donetext">
          <span className="zn-ask__donetitle">پرسش شما ثبت شد</span>
          <span className="zn-ask__donebody">
            پاسخ کارشناس تا پایان امروز با پیامک برای شما ارسال می‌شود.
          </span>
        </span>
      </div>
    );
  }

  const invalid = state.status === 'invalid';

  return (
    <form className="zn-ask" action={action}>
      <input type="hidden" name="slug" value={slug} />

      <h2 className="zn-ask__title">پرسش خود را بپرسید</h2>
      <p className="zn-ask__hint">
        درباره وزن، عیار، سایز، ارسال یا شرایط اقساط بپرسید. پاسخ با پیامک برای شما ارسال می‌شود.
      </p>

      <label className="sr-only" htmlFor={fieldId}>
        متن پرسش
      </label>
      <textarea
        className="zn-ask__field"
        id={fieldId}
        name="body"
        rows={3}
        maxLength={QUESTION_BODY_MAX}
        required
        defaultValue={state.status === 'idle' ? '' : state.body}
        placeholder="مثلاً: نگین این انگشتر قابل تعویض است؟"
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
      />

      {state.status === 'invalid' ? (
        <p className="zn-ask__error" id={errorId} role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === 'unavailable' ? (
        <p className="zn-ask__error" role="alert">
          ثبت پرسش هنوز فعال نیست. تا راه‌اندازی، از طریق تماس تلفنی پاسخ می‌گیرید.
        </p>
      ) : null}

      <button className="zn-ask__submit" type="submit" disabled={pending}>
        {pending ? 'در حال ارسال…' : 'ارسال پرسش'}
      </button>
    </form>
  );
}
