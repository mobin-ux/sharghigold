import type { Metadata } from 'next';

import { ContentPageView } from '@/components/content/content-page';
import { routes } from '@/lib/routes';
import { ABOUT_PAGE, ABOUT_PAGES } from '@/server/content/pages';

import '../doc.css';

export const metadata: Metadata = {
  title: ABOUT_PAGE.title,
  description: ABOUT_PAGE.lede,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const related = ABOUT_PAGES.map((page) => ({
    title: page.title,
    href: routes.about(page.slug),
  }));

  return <ContentPageView page={ABOUT_PAGE} related={related} />;
}
