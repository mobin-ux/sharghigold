import Link from 'next/link';
import type { ReactElement } from 'react';

import {
  BangleMark,
  BraceletMark,
  EarringMark,
  NecklaceMark,
  RingMark,
  SetMark,
} from '@/components/category-icons';
import { SectionHeader } from '@/components/home/section-header';

interface Category {
  readonly slug: string;
  readonly label: string;
  readonly mark: ReactElement;
}

const CATEGORIES: readonly Category[] = [
  { slug: 'rings', label: 'انگشتر', mark: <RingMark /> },
  { slug: 'earrings', label: 'گوشواره', mark: <EarringMark /> },
  { slug: 'necklaces', label: 'گردنبند', mark: <NecklaceMark /> },
  { slug: 'bangles', label: 'النگو', mark: <BangleMark /> },
  { slug: 'bracelets', label: 'دستبند', mark: <BraceletMark /> },
  { slug: 'sets', label: 'سرویس و نیم‌ست', mark: <SetMark /> },
];

/** The six-tile category grid. Plain links; no JavaScript involved. */
export function CategoryGrid() {
  return (
    <section className="zn-section zn-section--open-20" aria-labelledby="categories-heading">
      <SectionHeader
        id="categories-heading"
        title="دسته‌بندی‌ها"
        href="/categories"
        linkLabel="همه دسته‌ها"
      />
      <ul className="zn-cats">
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link className="zn-cat" href={`/categories/${category.slug}`}>
              <span className="zn-cat__mark">{category.mark}</span>
              <span className="zn-cat__label">{category.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
