'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { applyDiscount } from '@/app/cart/actions';
import { EMPTY_CODE_STATE, type CodeState } from '@/app/cart/state';

/**
 * «کد تخفیف یا کارت هدیه».
 *
 * The field keeps what was typed when a code is refused, which is the whole
 * reason this one form is a client island: a redirect would lose it, and
 * retyping a code you have just been told is wrong is the wrong kind of
 * punishment.
 *
 * The code is the only thing that travels. What it is worth is decided on the
 * server against the basket and recomputed every time the basket is priced, so
 * there is no discount figure here to edit.
 */
export function CodeForm({
  appliedLabel,
  appliedCode,
  onRemove,
}: {
  /** The code already on the basket, if there is one. */
  readonly appliedLabel: string | null;
  readonly appliedCode: string | null;
  /** The Server Action that takes the code off again. */
  readonly onRemove: () => void | Promise<void>;
}) {
  const [state, action] = useActionState<CodeState, FormData>(
    applyDiscount,
    appliedCode === null
      ? EMPTY_CODE_STATE
      : { status: 'applied', label: appliedLabel ?? '', code: appliedCode },
  );

  const invalid = state.status === 'invalid';
  const message =
    state.status === 'invalid'
      ? state.message
      : appliedLabel !== null
        ? `${appliedLabel} اعمال شد`
        : state.status === 'applied'
          ? `${state.label} اعمال شد`
          : null;

  return (
    <section className="zn-code" aria-label="کد تخفیف">
      <h2 className="zn-code__title">کد تخفیف یا کارت هدیه</h2>

      <form className="zn-code__row" action={action}>
        <span className={invalid ? 'zn-code__box zn-code__box--bad' : 'zn-code__box'}>
          <input
            className="zn-code__input"
            name="code"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            defaultValue={state.code}
            placeholder="مثلاً ZARNAMA10"
            aria-label="کد تخفیف"
            aria-invalid={invalid}
            aria-describedby={message === null ? undefined : 'zn-code-msg'}
          />
        </span>

        <SubmitButton className="zn-code__go" pendingLabel="…">
          اعمال
        </SubmitButton>
      </form>

      {message === null ? null : (
        <div
          className={invalid ? 'zn-code__msg zn-code__msg--bad' : 'zn-code__msg'}
          id="zn-code-msg"
          role={invalid ? 'alert' : 'status'}
        >
          <span>{message}</span>
          {invalid || appliedCode === null ? null : (
            <form action={onRemove}>
              <button className="zn-code__drop" type="submit">
                برداشتن
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
