export interface OrderStepperProps {
  /** The stages, in order. */
  readonly steps: readonly string[];
  /** Index of the stage being worked on. Everything before it is done. */
  readonly current?: number;
  /** Names the list for assistive technology. Defaults to «مراحل سفارش». */
  readonly label?: string;
}

const PERSIAN = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function persian(value: number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN[Number(digit)] ?? digit);
}

/**
 * `<OrderStepper>` — where something has got to, as a row of dots.
 *
 * An ordered list, because that is what it is: the stages have a sequence and
 * a screen reader should say so. The current stage carries `aria-current`, so
 * «where am I» is answered without relying on the colour of a circle.
 *
 * Used for order progress and for the three steps of identity verification,
 * which is why the accessible name is a prop rather than the design system's
 * fixed «مراحل سفارش».
 *
 * A Server Component: it draws state it is given and owns none.
 */
export function OrderStepper({ steps, current = 0, label = 'مراحل سفارش' }: OrderStepperProps) {
  return (
    <ol className="zn-steps" aria-label={label}>
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';

        return (
          <li
            key={step}
            className={state === 'todo' ? 'zn-step' : `zn-step zn-step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="zn-step__line" aria-hidden="true" />
            <span className="zn-step__dot">
              {index < current ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                persian(index + 1)
              )}
            </span>
            <span className="zn-step__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
