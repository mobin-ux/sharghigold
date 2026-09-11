/**
 * React ports of the Zarnama Gold components.
 *
 * Each one renders the design system's own class names against the stylesheet
 * extracted from its bundle, so the appearance is the design system's rather
 * than a reimplementation that can drift from it. Props are typed against the
 * generated contracts, so a variant the design system does not define will not
 * compile.
 *
 * Two deliberate departures, both forced by server rendering and both
 * documented on the components themselves:
 *
 *   - Interactive parts arrive as slots (`actions`, `favorite`, `media`)
 *     instead of callback props, so cards stay Server Components.
 *   - Prices arrive as formatted strings, because `Rials` is a bigint that
 *     cannot cross the server/client boundary and must not become a float.
 */
export { Alert, type AlertProps } from './alert.js';
export { Badge, type BadgeProps } from './badge.js';
export { Button, type ButtonProps } from './button.js';
export { IconButton, type IconButtonProps } from './icon-button.js';
export { OrderStepper, type OrderStepperProps } from './order-stepper.js';
export { PriceChange, type PriceChangeProps } from './price-change.js';
export { PriceTicker, type PriceTickerProps, type TickerItem } from './price-ticker.js';
export { ProductCard, type ProductCardProps } from './product-card.js';
export { Spinner, type SpinnerProps } from './spinner.js';
