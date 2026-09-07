import { PriceChange } from './price-change.js';

export interface TickerItem {
  readonly name: string;
  /** Already formatted, without the unit. See `ProductCardProps.price`. */
  readonly price: string;
  /** Percentage movement. Presentational; see `PriceChangeProps.value`. */
  readonly change?: number;
}

export interface PriceTickerProps {
  readonly items: readonly TickerItem[];
  readonly label?: string;
  /**
   * When the quote was taken. Rendered as a visually hidden note so the strip
   * does not silently imply the figures are live if the feed is stale.
   */
  readonly asOf?: string;
}

/**
 * `<PriceTicker>` — the design system's `.zn-ticker`.
 *
 * The marquee duplicates the list so the animation can loop seamlessly. The
 * copy is `aria-hidden`, and the strip is a plain region rather than
 * `role="marquee"`: the design system's `role="marquee"` announces the whole
 * strip as a live region, so a screen reader re-reads gold prices on every
 * animation frame it notices. The prices are worth reading once.
 */
export function PriceTicker({ items, label = 'بازار زنده', asOf }: PriceTickerProps) {
  return (
    <div className="zn-ticker" aria-label={label}>
      <span className="zn-ticker__label">
        <span className="zn-ticker__dot" aria-hidden="true" />
        {label}
      </span>
      <div className="zn-ticker__view">
        <div className="zn-ticker__track">
          {items.map((item) => (
            <span className="zn-ticker__item" key={item.name}>
              <span className="zn-ticker__name">{item.name}</span>
              <span className="zn-ticker__val">{item.price}</span>
              {item.change === undefined ? null : <PriceChange value={item.change} bare />}
            </span>
          ))}
          <span aria-hidden="true" className="zn-ticker__loop">
            {items.map((item) => (
              <span className="zn-ticker__item" key={item.name}>
                <span className="zn-ticker__name">{item.name}</span>
                <span className="zn-ticker__val">{item.price}</span>
                {item.change === undefined ? null : <PriceChange value={item.change} bare />}
              </span>
            ))}
          </span>
        </div>
      </div>
      {asOf === undefined ? null : <span className="sr-only">{asOf}</span>}
    </div>
  );
}
