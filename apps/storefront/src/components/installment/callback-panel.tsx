'use client';

import { useActionState } from 'react';

import { requestInstallmentCallback } from '@/app/installment/actions';
import { CALLBACK_IDLE } from '@/app/installment/state';

/**
 * «مشاوره تلفنی رایگان» — leave a number, an adviser rings back.
 *
 * Posts to a Server Action that parses the number with the shared contract and
 * rate-limits it, so without JavaScript the form still posts and the page
 * re-renders with the answer. The answer sits under the row in a live region,
 * as the canvas places it; an error also marks the field invalid.
 */
export function CallbackPanel({
  title,
  body,
  submit,
}: {
  readonly title: string;
  readonly body: string;
  readonly submit: string;
}) {
  const [state, action, pending] = useActionState(requestInstallmentCallback, CALLBACK_IDLE);
  const failed = state.status === 'error';

  return (
    <section className="zn-instsec" aria-labelledby="callback-title">
      <div className="zn-callback">
        <h2 className="zn-callback__title" id="callback-title">
          {title}
        </h2>
        <p className="zn-callback__body">{body}</p>

        <form className="zn-callback__form" action={action}>
          <label className="sr-only" htmlFor="callback-phone">
            شماره موبایل برای مشاوره
          </label>
          <div className="zn-callback__field">
            <input
              className="zn-input zn-input--md"
              id="callback-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={20}
              required
              dir="ltr"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              aria-invalid={failed || undefined}
              aria-describedby="callback-status"
            />
          </div>
          <button className="zn-callback__submit" type="submit" disabled={pending}>
            {submit}
          </button>
        </form>

        <p
          className={`zn-callback__status${failed ? ' zn-callback__status--bad' : ''}`}
          id="callback-status"
          role="status"
        >
          {state.status === 'idle' ? '' : state.message}
        </p>
      </div>
    </section>
  );
}
