import { toPersianDigits } from '@sharghigold/ui';

import { MinusIcon, PlusIcon } from '@/components/icons';

/**
 * The design system's `.zn-qty`, built out of two submit buttons.
 *
 * The canvas version is a client component holding the number in state and
 * calling back. Here the number lives in the basket on the server, which is
 * where it has to live anyway — a quantity kept in a browser is a quantity
 * that disagrees with the basket the moment a second tab is open.
 *
 * So this is a Server Component and a plain form: each button submits the
 * quantity it would produce. It works before hydration and without JavaScript
 * at all, and the value shown is always the one the server would charge for.
 *
 * `max` caps the control at what is in stock. It is a courtesy — the server
 * clamps the same request, because a disabled button is not inventory control.
 */
export function QuantityForm({
  action,
  lineId,
  quantity,
  max,
}: {
  readonly action: (form: FormData) => void | Promise<void>;
  readonly lineId: string;
  readonly quantity: number;
  readonly max: number;
}) {
  const ceiling = Math.max(1, max);

  return (
    <form className="zn-qty zn-qty--sm" action={action}>
      <input type="hidden" name="line" value={lineId} />

      <button
        className="zn-qty__btn"
        type="submit"
        name="quantity"
        value={quantity + 1}
        aria-label="افزایش تعداد"
        disabled={quantity >= ceiling}
      >
        <PlusIcon size={18} strokeWidth={2} />
      </button>

      <span className="zn-qty__val">{toPersianDigits(quantity)}</span>

      <button
        className="zn-qty__btn"
        type="submit"
        name="quantity"
        value={quantity - 1}
        aria-label="کاهش تعداد"
        disabled={quantity <= 1}
      >
        <MinusIcon size={18} strokeWidth={2} />
      </button>
    </form>
  );
}
