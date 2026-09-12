'use client';

import Link from 'next/link';

import { routes } from '@/lib/routes';

/**
 * The page shown when a route throws.
 *
 * A client component because the framework requires it: this boundary has to
 * be able to re-run the render, which is what `reset` does.
 *
 * There is deliberately no reporting call here yet. When an error reporter
 * lands it is an effect in this component and nothing else changes.
 *
 * What it deliberately does not show is the error. `error.message` on a
 * production build is already scrubbed by the framework, but the habit is the
 * point — a stack trace, a query, or the sentence «could not connect to
 * postgres://…» is information the shop hands an attacker for free. The digest
 * is a server-side correlation id with no content of its own, and it is the
 * only thing worth printing, because it is what support asks for.
 */
export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="zn-shell zn-shell--message">
      <div className="zn-pagemsg">
        <h1 className="zn-pagemsg__title">مشکلی پیش آمد</h1>
        <p className="zn-pagemsg__body">
          این صفحه بارگذاری نشد. چند لحظه دیگر دوباره تلاش کنید؛ اگر تکرار شد با پشتیبانی تماس
          بگیرید.
        </p>

        <div className="zn-pagemsg__actions">
          <button className="zn-pagemsg__primary" type="button" onClick={reset}>
            تلاش دوباره
          </button>
          <Link className="zn-pagemsg__secondary" href={routes.home()}>
            صفحه اصلی
          </Link>
        </div>

        {error.digest === undefined ? null : (
          <p className="zn-pagemsg__code" dir="ltr">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
