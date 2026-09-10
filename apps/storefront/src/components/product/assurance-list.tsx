import { PolicyIcon } from '@/components/product/policy-icon';
import { ASSURANCES } from '@/server/policy/shop-policy';

/**
 * The four promises that sit under the instalment card.
 *
 * A list, not four divs: it is four items of the same kind, and saying so is
 * what lets a screen reader announce «۴ مورد» and let the reader skip it.
 */
export function AssuranceList() {
  return (
    <ul className="zn-assure" aria-label="تضمین‌های خرید">
      {ASSURANCES.map((assurance) => (
        <li className="zn-assure__row" key={assurance.title}>
          <span className="zn-assure__mark">
            <PolicyIcon icon={assurance.icon} />
          </span>
          <span className="zn-assure__text">
            <span className="zn-assure__title">{assurance.title}</span>
            <span className="zn-assure__note">{assurance.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
