'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

interface SubmitButtonProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** What the button says while the request is in flight. */
  readonly pendingLabel?: string;
  /** Disabled for a reason of the page's own, on top of the pending state. */
  readonly disabled?: boolean;
}

/**
 * A submit button that says when it is working.
 *
 * `useFormStatus` reads the state of the form above it, so the button knows
 * about a submission without the page having to thread a flag down to it.
 *
 * The point is not the wording. It is that the button is disabled while the
 * request is in flight, which is what stops a second press creating a second
 * address, a second sign-in, or a second submission of the same documents. The
 * server is idempotent where it can be; this is the half that keeps the
 * customer from having to rely on that.
 */
export function SubmitButton({
  children,
  className,
  pendingLabel,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending || disabled}>
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
