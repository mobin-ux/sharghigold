import Link from 'next/link';

import { SectionHeader } from '@/components/home/section-header';
import { Mark } from '@/components/marks/mark';
import { routes } from '@/lib/routes';

interface Category {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * The six categories the homepage promotes.
 *
 * Still a literal, unlike the category browser, and that is a known gap rather
 * than a decision: this is a merchandising choice — which six of the eight to
 * feature — and it belongs with the rest of the catalogue behind
 * `getCategoryNavigation()`. It moves when the homepage is next touched.
 */
const CATEGORIES: readonly Category[] = [
  { slug: 'rings', label: 'انگشتر', icon: 'ring' },
  { slug: 'earrings', label: 'گوشواره', icon: 'earring' },
  { slug: 'necklaces', label: 'گردنبند', icon: 'necklace' },
  { slug: 'bangles', label: 'النگو', icon: 'bangle' },
  { slug: 'bracelets', label: 'دستبند', icon: 'bracelet' },
  { slug: 'sets', label: 'سرویس و نیم‌ست', icon: 'set' },
];

/** The six-tile category grid. Plain links; no JavaScript involved. */
export function CategoryGrid() {
  return (
    <section className="zn-section zn-section--open-20" aria-labelledby="categories-heading">
      <SectionHeader
        id="categories-heading"
        title="دسته‌بندی‌ها"
        href={routes.categories()}
        linkLabel="همه دسته‌ها"
      />
      <ul className="zn-cats">
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link className="zn-cat" href={`/categories/${category.slug}`}>
              <span className="zn-cat__mark">
                <Mark icon={category.icon} />
              </span>
              <span className="zn-cat__label">{category.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
