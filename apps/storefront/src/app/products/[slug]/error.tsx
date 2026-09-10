'use client';

import { useEffect } from 'react';

/**
 * What a customer sees when the product cannot be produced or priced.
 *
 * Deliberately says nothing about why. `error.message` on a server error is
 * redacted by Next in production, but relying on that is the wrong habit —
 * this component is the place a stack trace, a pricing failure or a database
 * message would leak to the browser, so it never renders one. The digest is
 * enough to find the matching server log and is safe to read aloud to support.
 */
export default function ProductError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <div className="zn-shell zn-shell--message">
      <div className="zn-pagemsg" role="alert">
        <h1 className="zn-pagemsg__title">این صفحه بارگذاری نشد</h1>
        <p className="zn-pagemsg__body">
          اطلاعات یا قیمت این کالا موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.
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
