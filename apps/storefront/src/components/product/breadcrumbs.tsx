import Link from 'next/link';
import type { BreadcrumbStep } from '@sharghigold/contracts';

/** Always the same, always the storefront's own URLs. */
const ROOT: readonly { readonly label: string; readonly href: string }[] = [
  { label: 'خانه', href: '/' },
  { label: 'دسته‌بندی‌ها', href: '/categories' },
];

/**
 * «خانه › طلای ۱۸ عیار › انگشتر › تک‌نگین».
 *
 * An ordered list inside a labelled `<nav>`, which is what makes it a trail
 * rather than four links in a row: assistive technology announces the depth
 * and the position, and the last crumb is marked as where you are.
 *
 * A crumb with no category slug is not a link. The storefront builds every URL
 * here from the slug, so a trail can never point somewhere the catalogue chose.
 */
export function Breadcrumbs({ steps }: { readonly steps: readonly BreadcrumbStep[] }) {
  const lastIndex = steps.length - 1;

  return (
    <nav className="zn-crumbs" aria-label="مسیر دسته‌بندی">
      <ol className="zn-crumbs__list">
        {ROOT.map((root, index) => (
          <li className="zn-crumbs__item" key={root.href}>
            {index > 0 ? (
              <span className="zn-crumbs__sep" aria-hidden="true">
                ‹
              </span>
            ) : null}
            <Link className="zn-crumbs__link" href={root.href}>
              {root.label}
            </Link>
          </li>
        ))}

        {steps.map((step, index) => (
          <li className="zn-crumbs__item" key={`${step.label}-${String(index)}`}>
            <span className="zn-crumbs__sep" aria-hidden="true">
              ‹
            </span>

            {step.categorySlug === null ? (
              <span
                className={index === lastIndex ? 'zn-crumbs__here' : undefined}
                aria-current={index === lastIndex ? 'page' : undefined}
              >
                {step.label}
              </span>
            ) : (
              <Link className="zn-crumbs__link" href={`/categories/${step.categorySlug}`}>
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
