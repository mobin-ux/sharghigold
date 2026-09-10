/**
 * The sticky strip that jumps to the three sections below it.
 *
 * Plain in-page anchors in a labelled `<nav>`. They are not tabs — nothing is
 * hidden and nothing is selected — so they are not marked up as tabs; a screen
 * reader that is told «tab, 1 of 3» here would be told something untrue about
 * what pressing it does.
 */
export function SectionTabs() {
  const sections = [
    { href: '#specs', label: 'مشخصات' },
    { href: '#reviews', label: 'دیدگاه‌ها' },
    { href: '#faq', label: 'پرسش‌ها' },
  ];

  return (
    <nav className="zn-jump" aria-label="بخش‌های این صفحه">
      {sections.map((section) => (
        <a className="zn-jump__link" key={section.href} href={section.href}>
          {section.label}
        </a>
      ))}
    </nav>
  );
}
