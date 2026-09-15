'use client';

import { useId, useRef } from 'react';

import { keepLineForLater, removeFromCart } from '@/app/cart/actions';
import { SubmitButton } from '@/components/account/submit-button';
import { TrashIcon } from '@/components/icons';

/**
 * The bin on a basket line, and the sheet it opens.
 *
 * The canvas asks before removing and offers the gentler choice first: keep
 * the piece for later. So the sheet carries three controls — save, remove,
 * back — and the first two are separate forms posting to their own actions.
 * The sheet sits outside the bin's form because forms cannot nest.
 *
 * Without JavaScript the bin is a plain submit and removes the line, which is
 * what it says it does. With JavaScript the click opens a `<dialog>` with
 * `showModal()`, so focus trapping, the inert page behind it and Escape come
 * from the platform.
 */
export function RemoveLineButton({
  lineId,
  title,
}: {
  readonly lineId: string;
  readonly title: string;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const heading = useId();

  return (
    <div className="zn-confirm">
      <form action={removeFromCart}>
        <input type="hidden" name="line" value={lineId} />
        <button
          className="zn-cline__drop"
          type="submit"
          aria-label="حذف از سبد"
          onClick={(event) => {
            const element = sheet.current;
            if (element === null || typeof element.showModal !== 'function') return;
            event.preventDefault();
            element.showModal();
          }}
        >
          <TrashIcon size={16} strokeWidth={1.8} />
        </button>
      </form>

      <dialog className="zn-dropsheet" ref={sheet} aria-labelledby={heading}>
        <span className="zn-dropsheet__handle" aria-hidden="true" />
        <h2 className="zn-dropsheet__title" id={heading}>
          حذف از سبد خرید
        </h2>
        <p className="zn-dropsheet__body">
          «{title}» از سبد حذف شود؟ می‌توانید به‌جای حذف، آن را برای بعد ذخیره کنید.
        </p>

        <div className="zn-dropsheet__actions">
          <form action={keepLineForLater}>
            <input type="hidden" name="line" value={lineId} />
            <SubmitButton className="zn-dropsheet__keep" pendingLabel="در حال ذخیره…">
              ذخیره برای بعد
            </SubmitButton>
          </form>

          <form action={removeFromCart}>
            <input type="hidden" name="line" value={lineId} />
            <SubmitButton className="zn-dropsheet__remove" pendingLabel="در حال حذف…">
              حذف کالا
            </SubmitButton>
          </form>

          <button
            className="zn-dropsheet__back"
            type="button"
            onClick={() => sheet.current?.close()}
          >
            بازگشت
          </button>
        </div>
      </dialog>
    </div>
  );
}
