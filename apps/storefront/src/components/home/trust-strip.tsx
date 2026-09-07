import type { ReactElement } from 'react';

import { InvoiceIcon, ReturnIcon, ShieldIcon, TruckIcon } from '@/components/icons';

const PROMISES: readonly { readonly label: string; readonly icon: ReactElement }[] = [
  { label: 'ضمانت اصالت', icon: <ShieldIcon size={20} /> },
  { label: 'فاکتور رسمی', icon: <InvoiceIcon size={20} /> },
  { label: 'ارسال بیمه‌شده', icon: <TruckIcon size={20} /> },
  { label: 'بازگشت ۷ روزه', icon: <ReturnIcon size={20} /> },
];

/**
 * The four trust promises under the categories.
 *
 * A list, not four divs: it is four items of the same kind, and a screen
 * reader saying "list of 4" is the whole point of the strip.
 */
export function TrustStrip() {
  return (
    <ul className="zn-trust" aria-label="تعهدات ما">
      {PROMISES.map((promise) => (
        <li className="zn-trust__item" key={promise.label}>
          <span className="zn-trust__icon">{promise.icon}</span>
          <span className="zn-trust__label">{promise.label}</span>
        </li>
      ))}
    </ul>
  );
}
