/**
 * Brand identity — the single place the storefront names itself.
 *
 * The design system readme is explicit that «زرنما» is a placeholder wordmark
 * with no drawn logo, and invites renaming. The repository is `sharghigold` and
 * the design brief cites sharghigold.ir, so the real name is almost certainly
 * different from what the canvas shows.
 *
 * Everything that renders the brand reads from here, so adopting the real name
 * is a one-line change rather than a sweep across eleven pages.
 */
export const BRAND = {
  /** Wordmark, as displayed in the header and footer. */
  name: 'زرنما',
  /** Sits under the wordmark. */
  tagline: 'طلا و جواهر از ۱۳۵۲',
  /** Used in page titles and structured data. Latin, for metadata contexts. */
  latinName: 'Zarnama',
  /** Owning legal entity, for the copyright line and invoices. */
  legalName: 'زرنما',
} as const;

/** Site-level values that feed metadata and SEO. */
export const SITE = {
  /** Canonical origin. Overridden per environment. */
  url: process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000',
  locale: 'fa_IR',
  /** BCP 47 language tag for the html element. */
  lang: 'fa',
  direction: 'rtl',
  description: 'خرید مطمئن طلا و جواهر با فاکتور رسمی و ضمانت اصالت؛ نیم‌قرن تجربه در بازار.',
} as const;
