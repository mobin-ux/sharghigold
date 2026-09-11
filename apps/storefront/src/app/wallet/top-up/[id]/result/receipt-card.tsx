'use client';

import { useEffect, useState } from 'react';

export interface ReceiptRow {
  readonly key: string;
  readonly label: string;
  /** Already formatted for reading. */
  readonly value: string;
  /** «تومان» after the figure, on the row that carries money. */
  readonly unit?: boolean;
  /** Digits read left to right: a tracking number, a timestamp. */
  readonly ltr?: boolean;
  /** Colours the value to the payment's tone. Only the status row uses it. */
  readonly tone?: string;
}

interface ReceiptCardProps {
  readonly rows: readonly ReceiptRow[];
  /** Latin digits to put on the clipboard, or nothing to copy. */
  readonly reference: string | null;
}

/**
 * The receipt, and the one button on it.
 *
 * A client component because copying is a browser capability, and because the
 * confirmation belongs directly under the number it is about rather than in a
 * toast somewhere else on the screen. The design puts that line further down
 * the page; here it sits where the button is, which is where somebody who
 * pressed it is looking.
 *
 * The rows arrive already formatted. Nothing is computed here — a receipt that
 * recalculates is a receipt that can disagree with the ledger.
 */
export function ReceiptCard({ rows, reference }: ReceiptCardProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2_400);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = () => {
    if (reference === null) return;
    navigator.clipboard
      ?.writeText(reference)
      .then(() => setState('copied'))
      .catch(() => setState('failed'));
  };

  return (
    <>
      <dl className="zn-receipt">
        {rows.map((row) => (
          <div className="zn-receipt__row" key={row.key}>
            <dt className="zn-receipt__key">{row.label}</dt>
            <dd className="zn-receipt__value">
              <span
                className="zn-receipt__figure"
                dir={row.ltr === true ? 'ltr' : undefined}
                style={row.tone === undefined ? undefined : { color: row.tone }}
              >
                {row.value}
              </span>
              {row.unit === true ? <span className="zn-receipt__unit">تومان</span> : null}
              {row.key === 'reference' && reference !== null ? (
                <button
                  className="zn-receipt__copy"
                  type="button"
                  aria-label="کپی شماره پیگیری"
                  onClick={copy}
                >
                  <CopyGlyph />
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <p
        className={`zn-result__copynote${state === 'failed' ? ' zn-result__copynote--bad' : ''}`}
        role="status"
      >
        {state === 'copied' ? 'شماره پیگیری کپی شد' : null}
        {state === 'failed' ? 'کپی نشد؛ شماره را دستی یادداشت کنید.' : null}
      </p>
    </>
  );
}

function CopyGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8.4" y="8.4" width="11.2" height="11.2" rx="2.2" />
      <path d="M15.6 5.6a2.2 2.2 0 0 0-2.2-2.2H6.6a2.2 2.2 0 0 0-2.2 2.2v6.8a2.2 2.2 0 0 0 2.2 2.2" />
    </svg>
  );
}
