'use client';

import { useActionState } from 'react';

import { subscribeToUpdates, type SubscribeState } from '@/app/actions';

const INITIAL: SubscribeState = { status: 'idle' };

/**
 * SMS sign-up.
 *
 * It used to be a disabled field posting to `/newsletter`, a path that did not
 * exist, with a note saying so. The note was honest and the form was still
 * dead. It now posts to a Server Action that validates the number against the
 * same contract the sign-in flow uses, rate-limits it, and records it.
 *
 * The answer replaces the standfirst rather than being added below it, so the
 * panel keeps the height the design draws. `role="status"` makes the swap
 * announced rather than only seen.
 *
 * `type="tel"` with `inputMode="numeric"` brings up the number pad on a phone.
 * `dir="ltr"` on the field is deliberate: a phone number is a left-to-right
 * sequence even in Persian text, and without it the digits and any leading
 * zero reorder as they are typed.
 *
 * A client component only because it shows the result of its own submission.
 * Without JavaScript the form still posts and the page still re-renders with
 * the answer, which is what a Server Action gives for free.
 */
export function Newsletter() {
  const [state, submit, pending] = useActionState(subscribeToUpdates, INITIAL);

  return (
    <section className="zn-news" aria-labelledby="newsletter-heading">
      <h2 className="zn-news__title" id="newsletter-heading">
        از تازه‌ها باخبر شوید
      </h2>

      <p
        className={`zn-news__lede${state.status === 'error' ? ' zn-news__lede--bad' : ''}`}
        id="newsletter-status"
        role="status"
      >
        {state.status === 'idle' ? 'هر هفته یک پیامک از مدل‌های تازه و تخفیف اجرت.' : state.message}
      </p>

      <form className="zn-news__form" action={submit}>
        <label className="sr-only" htmlFor="newsletter-phone">
          شماره موبایل
        </label>
        <input
          className="zn-news__input"
          id="newsletter-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={20}
          required
          dir="ltr"
          placeholder="شماره موبایل"
          aria-describedby="newsletter-status"
          aria-invalid={state.status === 'error'}
        />
        <button className="zn-news__submit" type="submit" disabled={pending}>
          {pending ? '…' : 'عضویت'}
        </button>
      </form>
    </section>
  );
}
