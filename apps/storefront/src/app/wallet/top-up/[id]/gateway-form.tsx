'use client';

import { useEffect, useRef } from 'react';

import { returnFromGateway } from '../actions';

/**
 * The step that stands where a bank's own page would.
 *
 * A real integration leaves the site here and comes back to a return URL. There
 * is no bank, so the return is made by submitting this form — after a short
 * pause, so the screen the design draws is actually seen.
 *
 * It submits itself when scripting is on and offers a button when it is not.
 * What it never carries is an outcome: the form posts the payment's id and
 * nothing else, and the server asks the provider what happened. A hidden field
 * saying «succeeded» is exactly the field an attacker would send.
 */
export function GatewayForm({ id }: { readonly id: string }) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => form.current?.requestSubmit(), 1_800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <form className="zn-gateway__return" action={returnFromGateway} ref={form}>
      <input type="hidden" name="id" value={id} />
      <noscript>
        <button className="zn-gateway__continue" type="submit">
          ادامه به درگاه بانکی
        </button>
      </noscript>
    </form>
  );
}
