import Link from 'next/link';

import { AllProductsMark, Mark } from '@/components/marks/mark';

export interface SubCategoryLink {
  readonly label: string;
  readonly href: string;
  /** Null for «all», which draws the neutral mark. */
  readonly icon: string | null;
  readonly current: boolean;
}

/**
 * The row of sub-type tiles under the header: «همه گوشواره‌ها», «آویز», …
 *
 * Each tile is a link to that sub-type's own listing, so the active one is the
 * page the customer is on and carries `aria-current`. The canvas fills each
 * tile with a plain gold disc as a stand-in; the marks the category browser
 * already draws for these same sub-types go there instead, at the disc's size.
 */
export function SubCategoryRail({
  label,
  links,
}: {
  /** What the row is, for assistive technology: «مدل‌های گوشواره». */
  readonly label: string;
  readonly links: readonly SubCategoryLink[];
}) {
  if (links.length === 0) return null;

  return (
    <nav className="zn-subrail" aria-label={label}>
      {links.map((link) => (
        <Link
          className={`zn-subrail__item${link.current ? ' zn-subrail__item--on' : ''}`}
          key={link.href}
          href={link.href}
          aria-current={link.current ? 'page' : undefined}
        >
          <span className="zn-subrail__tile">
            {link.icon === null ? <AllProductsMark /> : <Mark icon={link.icon} />}
          </span>
          <span className="zn-subrail__label">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
