import type { ReactNode } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { ArrowIcon } from '@/components/icons';
import { toman } from '@/lib/cart-view';

/**
 * The bar pinned to the bottom of every checkout screen.
 *
 * It shows what is owed and moves to the next step. The figure is the server's
 * — computed on this render from the basket and today's locked rate — and the
 * button is a submit inside a real form, so the step it opens is a decision
 * the server makes rather than a link anybody can type.
 *
 * `disabled` is presentation only. Every rule this bar enforces is enforced
 * again by the action behind it, because a disabled button stops a customer
 * and nothing else.
 */
export function CheckoutBar({
  action,
  label,
  amountRials,
  cta,
  hint,
  disabled = false,
  children,
}: {
  /**
   * The Server Action to submit to, or `null` when the bar sits inside a form
   * that already has one. Forms cannot nest, and the delivery screen's text
   * fields have to be submitted by the same press that continues.
   */
  readonly action: ((form: FormData) => void | Promise<void>) | null;
  readonly label: string;
  readonly amountRials: string;
  readonly cta: string;
  readonly hint?: string | undefined;
  readonly disabled?: boolean;
  /** Hidden fields the action needs, such as the review screen's token. */
  readonly children?: ReactNode;
}) {
  const body = (
    <>
      {children}

      <div className="zn-paybar__row">
        <span className="zn-paybar__price">
          <span className="zn-paybar__label">{label}</span>
          <span className="zn-paybar__amount">
            <span className="zn-paybar__figure">{toman(amountRials)}</span>
            <span className="zn-paybar__unit">تومان</span>
          </span>
        </span>

        <SubmitButton
          className={disabled ? 'zn-paybar__cta zn-paybar__cta--off' : 'zn-paybar__cta'}
          pendingLabel="لحظه‌ای صبر کنید…"
        >
          {cta}
          <ArrowIcon size={17} strokeWidth={2} />
        </SubmitButton>
      </div>

      {hint === undefined || hint === '' ? null : <p className="zn-paybar__hint">{hint}</p>}
    </>
  );

  return action === null ? (
    <div className="zn-paybar">{body}</div>
  ) : (
    <form className="zn-paybar" action={action}>
      {body}
    </form>
  );
}
