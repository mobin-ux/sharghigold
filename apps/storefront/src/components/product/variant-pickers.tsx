'use client';

import { useId } from 'react';
import type { ProductDetail } from '@sharghigold/contracts';

import { InfoIcon } from '@/components/icons';
import { usePurchase } from '@/components/product/purchase-context';
import { COLOUR_SWATCH, persianCount } from '@/lib/product-view';

/**
 * Choosing the gold colour and the ring size.
 *
 * Both are radio groups, and both are built out of real radio inputs rather
 * than the canvas's `<button>`s. A radio group is what this is — one of
 * several, mutually exclusive — and using the real control brings arrow-key
 * navigation, the correct announcement («۳ از ۶»), and a disabled state that
 * means something, without a line of keyboard code.
 *
 * A size that is out of stock is a disabled radio. That is a courtesy, not a
 * control: what can actually be sold is decided by the server against stock
 * when the order is placed (rules 15 and 17).
 */

function Swatch({ colour }: { readonly colour: keyof typeof COLOUR_SWATCH }) {
  return (
    <span className="zn-swatch" style={{ background: COLOUR_SWATCH[colour] }} aria-hidden="true" />
  );
}

export function ColourPicker({ product }: { readonly product: ProductDetail }) {
  const { colour, setColour } = usePurchase();
  const name = useId();

  return (
    <fieldset className="zn-variant">
      <legend className="zn-variant__legend">رنگ طلا</legend>

      <div className="zn-variant__row">
        {product.colours.map((option) => (
          <label
            className={`zn-chip zn-chip--colour${option.colour === colour ? ' zn-chip--on' : ''}`}
            key={option.colour}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.colour}
              checked={option.colour === colour}
              disabled={!option.available}
              onChange={() => setColour(option.colour)}
            />
            <Swatch colour={option.colour} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SizePicker({ product }: { readonly product: ProductDetail }) {
  const { size, setSize, openSizeGuide } = usePurchase();
  const name = useId();

  const chosen = size === null ? null : persianCount(size);

  return (
    <fieldset className="zn-variant">
      <div className="zn-variant__head">
        <legend className="zn-variant__legend">سایز انگشتر</legend>

        <button className="zn-variant__guide" type="button" onClick={openSizeGuide}>
          <InfoIcon />
          راهنمای سایز
        </button>
      </div>

      <div className="zn-variant__row zn-variant__row--wrap">
        {product.sizes.map((option) => (
          <label
            className={`zn-chip zn-chip--size${option.value === size ? ' zn-chip--on' : ''}${
              option.available ? '' : ' zn-chip--out'
            }`}
            key={option.value}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === size}
              disabled={!option.available}
              onChange={() => setSize(option.value)}
            />
            {persianCount(option.value)}
          </label>
        ))}
      </div>

      <p className="zn-variant__hint">
        {chosen === null
          ? 'در حال حاضر سایزی از این مدل موجود نیست؛ برای سفارش سایز دلخواه با پشتیبانی تماس بگیرید.'
          : `سایز ${chosen} انتخاب شده است. سایزهای خط‌خورده فعلاً موجود نیستند؛ سفارش ساخت ۱۰ روز کاری زمان می‌برد.`}
      </p>
    </fieldset>
  );
}
