'use client';

import type { FormEvent, ReactNode } from 'react';

/**
 * A group of radio buttons that posts as soon as one is chosen.
 *
 * Every choice on the checkout screens changes what the server would charge —
 * a courier instead of the post, a branch instead of an address — so each one
 * has to reach the server rather than being remembered in a browser until the
 * end. The controls inside are real `<input type="radio">` elements in a real
 * fieldset, which is what gives them arrow-key navigation, a group name read
 * aloud, and a checked state assistive technology already understands. The
 * design draws them as buttons with `role="radio"`, which looks the same and
 * has none of that.
 *
 * The client half is one line: submit the form when the selection changes.
 * Without it the form still works — the `<noscript>` button posts the same
 * selection — so this island is an improvement on a page that is already
 * functional rather than the thing that makes it work.
 */
/** Post the group as soon as the selection changes. */
function submitOnChange(event: FormEvent<HTMLFormElement>): void {
  event.currentTarget.requestSubmit();
}

export function ChoiceForm({
  action,
  className,
  children,
}: {
  readonly action: (form: FormData) => void | Promise<void>;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <form className={className} action={action} onChange={submitOnChange}>
      {children}
      <noscript>
        <button className="zn-choice__go" type="submit">
          تأیید انتخاب
        </button>
      </noscript>
    </form>
  );
}
