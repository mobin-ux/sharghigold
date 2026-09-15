'use client';

import { useState } from 'react';

import { CopyIcon, TickIcon } from './order-icons';

/**
 * «کپی کد رهگیری». A script only because the clipboard is. Without one the
 * code is still on the page to select, which is what the button saves.
 */
export function CopyCode({ value, label }: { readonly value: string; readonly label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="zn-ordcode__copy"
      type="button"
      aria-label={copied ? 'کپی شد' : label}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          return window.setTimeout(() => setCopied(false), 2_400);
        });
      }}
    >
      {copied ? <TickIcon size={15} weight={2.2} /> : <CopyIcon />}
    </button>
  );
}
