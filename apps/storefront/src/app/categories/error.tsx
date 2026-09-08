'use client';

import { useEffect } from 'react';

/**
 * What a customer sees when the catalogue cannot be produced.
 *
 * Deliberately says nothing about *why*. `error.message` on a server error is
 * redacted by Next in production, but relying on that is the wrong habit —
 * this component is the place a stack trace or a database message would leak
 * to the browser, so it never renders one. The digest is enough to find the
 * matching server log, and is safe to read aloud to support.
 */
export default function CategoriesError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // Reported to the browser console only in development; production
    // reporting belongs to a real error sink, not to console noise.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <div className="zn-appshell zn-appshell--message">
      <div className="zn-pagemsg" role="alert">
        <h1 className="zn-pagemsg__title">دسته‌بندی‌ها در دسترس نیست</h1>
        <p className="zn-pagemsg__body">
          فهرست دسته‌بندی‌ها موقتاً بارگذاری نشد. لطفاً دوباره تلاش کنید.
        </p>
        <button className="zn-btn zn-btn--md" type="button" onClick={reset}>
          تلاش دوباره
        </button>
        {error.digest === undefined ? null : (
          <p className="zn-pagemsg__code">کد پیگیری: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
