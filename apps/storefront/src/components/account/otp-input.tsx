'use client';

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** Persian and Arabic-Indic digits back to Latin, everything else dropped. */
function latin(value: string): string {
  let out = '';
  for (const character of value) {
    const digit = PERSIAN.indexOf(character);
    if (digit >= 0) {
      out += String(digit);
      continue;
    }
    const code = character.codePointAt(0) ?? 0;
    if (code >= 0x0660 && code <= 0x0669) out += String(code - 0x0660);
    else if (character >= '0' && character <= '9') out += character;
  }
  return out;
}

function persian(value: string): string {
  return value.replace(/[0-9]/g, (digit) => PERSIAN[Number(digit)] ?? digit);
}

interface OtpInputProps {
  readonly length?: number;
  /** The form field the joined code is submitted under. */
  readonly name: string;
  readonly error?: boolean;
  readonly describedBy?: string;
}

/**
 * The row of single-digit boxes a code is typed into.
 *
 * Class names are the design system's, so the appearance comes from
 * `components.css` rather than from a second drawing of the same control. Three
 * things differ from the design system's own version, and all three are about
 * a code arriving from somewhere other than the keyboard:
 *
 * - **`autoComplete="one-time-code"`** on the first box. That is what makes
 *   iOS and Android offer the code from the SMS they just received. Without
 *   it, every customer reads five digits off a notification and types them.
 * - **Paste fills the row.** A pasted code lands in one box otherwise, which
 *   is what happens to everybody who copies it out of the message.
 * - **One hidden field carries the value.** The boxes are display; the form
 *   submits `name` once, so nothing has to reassemble five fields — and the
 *   digits are latinised on the way, because the server compares against a
 *   code it generated in Latin.
 *
 * Cells stay in visual order under `dir="ltr"`, which is how a number is read
 * even inside a Persian page.
 */
export function OtpInput({ length = 5, name, error = false, describedBy }: OtpInputProps) {
  const [digits, setDigits] = useState<readonly string[]>(() => Array.from({ length }, () => ''));
  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const put = (index: number, value: string) => {
    setDigits((previous) => previous.map((digit, at) => (at === index ? value : digit)));
  };

  const fill = (from: number, value: string) => {
    setDigits((previous) =>
      previous.map((digit, at) =>
        at >= from && at - from < value.length ? (value[at - from] ?? '') : digit,
      ),
    );
    cells.current[Math.min(length - 1, from + value.length)]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && digits[index] === '' && index > 0) {
      cells.current[index - 1]?.focus();
    }
    // The row is LTR, so the left arrow moves to the next cell.
    if (event.key === 'ArrowLeft' && index < length - 1) cells.current[index + 1]?.focus();
    if (event.key === 'ArrowRight' && index > 0) cells.current[index - 1]?.focus();
  };

  const onPaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = latin(event.clipboardData.getData('text')).slice(0, length - index);
    if (pasted === '') return;
    event.preventDefault();
    fill(index, pasted);
  };

  return (
    <div className={error ? 'zn-otp zn-otp--error' : 'zn-otp'}>
      <input type="hidden" name={name} value={digits.join('')} />
      <div className="zn-otp__row" dir="ltr">
        {digits.map((digit, index) => (
          <input
            className="zn-otp__cell"
            // The boxes have no identity beyond their position, which is what
            // the key is. Nothing is inserted or removed from the row.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            ref={(element) => {
              cells.current[index] = element;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            aria-label={`رقم ${persian(String(index + 1))}`}
            aria-invalid={error}
            aria-describedby={describedBy}
            data-filled={digit === '' ? 'false' : 'true'}
            value={persian(digit)}
            onChange={(event) => {
              const typed = latin(event.target.value);
              if (typed.length > 1) {
                fill(index, typed.slice(0, length - index));
                return;
              }
              put(index, typed);
              if (typed !== '' && index < length - 1) cells.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => onKeyDown(index, event)}
            onPaste={(event) => onPaste(index, event)}
          />
        ))}
      </div>
    </div>
  );
}
