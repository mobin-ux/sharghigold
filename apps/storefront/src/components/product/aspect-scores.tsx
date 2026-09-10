import type { AspectScore } from '@sharghigold/contracts';

import { ASPECT_LABEL, persianDecimal } from '@/lib/product-view';

/**
 * «امتیاز در جزئیات» — build quality, likeness to the photographs, value.
 *
 * The bar is a labelled `progressbar`, and its width comes from the score
 * rather than from a percentage the server was asked to compute twice. Five
 * stars is the scale, so the fill is the score over five, in integers.
 */
export function AspectScores({ aspects }: { readonly aspects: readonly AspectScore[] }) {
  if (aspects.length === 0) return null;

  return (
    <section className="zn-aspects" aria-labelledby="aspects">
      <h2 className="zn-aspects__title" id="aspects">
        امتیاز در جزئیات
      </h2>

      {aspects.map((aspect) => {
        // Tenths, so 4.9 becomes 98 without ever touching a float.
        const tenths = Math.round(Number(aspect.average) * 10);
        const percent = Math.min(100, Math.round((tenths * 100) / 50));

        return (
          <div className="zn-aspects__row" key={aspect.aspect}>
            <span className="zn-aspects__label">{ASPECT_LABEL[aspect.aspect]}</span>

            <span
              className="zn-aspects__track"
              role="progressbar"
              aria-valuenow={tenths / 10}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label={`${ASPECT_LABEL[aspect.aspect]}: ${persianDecimal(aspect.average)} از ۵`}
            >
              <span className="zn-aspects__fill" style={{ inlineSize: `${String(percent)}%` }} />
            </span>

            <span className="zn-aspects__score">{persianDecimal(aspect.average)}</span>
          </div>
        );
      })}
    </section>
  );
}
