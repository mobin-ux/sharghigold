import type { ProductDetail } from '@sharghigold/contracts';

/**
 * Reading a product's place in the catalogue off its breadcrumb.
 *
 * The trail already says which category a piece belongs to and what that
 * category is called, so the page derives both from it. The alternative — two
 * more fields on the product — is two more things that can disagree with the
 * trail printed above them.
 */

interface Placement {
  /** «/categories/rings», or the whole catalogue when the trail names none. */
  readonly categoryHref: string;
  /** «/installment?category=rings», for the terms link on this page. */
  readonly installmentHref: string;
  /** What to call the thing in a sentence: «درباره این انگشتر». */
  readonly noun: string;
}

export function placementOf(product: ProductDetail): Placement {
  const step = product.breadcrumb.toReversed().find((crumb) => crumb.categorySlug !== null);
  const slug = step?.categorySlug ?? null;

  return {
    categoryHref: slug === null ? '/categories' : `/categories/${slug}`,
    installmentHref: slug === null ? '/installment' : `/installment?category=${slug}`,
    // «کالا» reads generically but it reads correctly, which is the right
    // failure for a sentence a customer sees.
    noun: step?.label ?? 'کالا',
  };
}
