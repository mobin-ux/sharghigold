'use client';

import { useRef, type ReactNode } from 'react';

import { SubmitButton } from './submit-button';

interface ConfirmButtonProps {
  /** The Server Action the confirmed form submits to. */
  readonly action: (form: FormData) => void | Promise<void>;
  readonly className?: string;
  readonly label: ReactNode;
  /** Used when `label` is an icon and the control needs a name of its own. */
  readonly accessibleLabel?: string;
  readonly title: string;
  readonly body: string;
  /** The wording on the button that actually does it. */
  readonly confirm: string;
  /** Hidden fields the action needs, such as which row this is. */
  readonly children?: ReactNode;
}

/**
 * A destructive control that asks first.
 *
 * The design does not ask: the trash icon deletes the address and a toast
 * appears. Deleting somebody's address with one mis-tap on a phone is a real
 * loss, and there is no undo behind it.
 *
 * Built so it works either way. The button is a genuine submit inside a
 * genuine form, so without JavaScript pressing it performs the action — the
 * page is still usable, it just stops asking. With JavaScript the click is
 * intercepted and the same form is submitted from inside a `<dialog>` opened
 * with `showModal()`, which brings the focus trap, the inert background and
 * the Escape key from the platform instead of from code somebody has to keep
 * right.
 */
export function ConfirmButton({
  action,
  className,
  label,
  accessibleLabel,
  title,
  body,
  confirm,
  children,
}: ConfirmButtonProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <form action={action} className="zn-confirm">
      {children}
      <button
        className={className}
        type="submit"
        aria-label={accessibleLabel}
        onClick={(event) => {
          const element = dialog.current;
          if (element === null || typeof element.showModal !== 'function') return;
          event.preventDefault();
          element.showModal();
        }}
      >
        {label}
      </button>

      <dialog className="zn-confirm__sheet" ref={dialog} aria-labelledby="zn-confirm-title">
        <h2 className="zn-confirm__title" id="zn-confirm-title">
          {title}
        </h2>
        <p className="zn-confirm__body">{body}</p>
        <div className="zn-confirm__actions">
          <button
            className="zn-confirm__cancel"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            انصراف
          </button>
          <SubmitButton className="zn-confirm__go" pendingLabel="در حال انجام…">
            {confirm}
          </SubmitButton>
        </div>
      </dialog>
    </form>
  );
}
