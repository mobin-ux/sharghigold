'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

/**
 * The sheet that slides up from the bottom, and the scrim behind it.
 *
 * A modal dialog, and built as one. The canvas draws two positioned divs with
 * a click handler on the scrim, which looks right and behaves badly: focus
 * stays on the page underneath, Escape does nothing, and a screen reader
 * carries on reading the product while the sheet is over it.
 *
 * `<dialog>` with `showModal()` gives all three from the platform — the
 * inert background, the focus trap, the Escape key — with no key handling of
 * our own. What is added is closing on a click outside, which `<dialog>`
 * deliberately does not do, and restoring the page's scroll position, which it
 * does not manage either.
 */
/** Stops a key press inside the sheet reaching a listener on the page behind it. */
function containKeys(event: KeyboardEvent<HTMLDialogElement>): void {
  event.stopPropagation();
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape fires `cancel`, and the parent owns the open flag, so the close has
  // to travel back up rather than being handled by the element alone.
  const onCancel = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onClose();
  };

  // A click that lands on the dialog element itself is a click on the backdrop:
  // everything inside is in the content wrapper below.
  const onClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };

  return (
    <dialog
      className="zn-sheet"
      ref={ref}
      aria-label={title}
      onCancel={onCancel}
      onClick={onClick}
      onKeyDown={containKeys}
    >
      <div className="zn-sheet__panel">
        <div className="zn-sheet__head">
          <h2 className="zn-sheet__title">{title}</h2>
          <button className="zn-sheet__close" type="button" aria-label="بستن" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="zn-sheet__body">{children}</div>
      </div>
    </dialog>
  );
}
