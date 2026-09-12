import type { Metadata } from 'next';

import { ContentPageView } from '@/components/content/content-page';
import { routes } from '@/lib/routes';
import { PRIVACY_PAGE, TERMS_PAGE } from '@/server/content/pages';

import '../doc.css';

export const metadata: Metadata = {
  title: TERMS_PAGE.title,
  description: TERMS_PAGE.lede,
  alternates: { canonical: '/terms' },
};

export default function Page() {
  const related = [
    { title: PRIVACY_PAGE.title, href: routes.privacy() },
    { title: TERMS_PAGE.title, href: routes.terms() },
    { title: 'سؤالات متداول', href: routes.help('faq') },
  ].filter((item) => item.title !== TERMS_PAGE.title);

  return <ContentPageView page={TERMS_PAGE} related={related} />;
}
