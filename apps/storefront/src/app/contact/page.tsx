import type { Metadata } from 'next';

import { ContentPageView } from '@/components/content/content-page';
import { routes } from '@/lib/routes';
import { CONTACT_PAGE, PRIVACY_PAGE, TERMS_PAGE } from '@/server/content/pages';

import '../doc.css';

export const metadata: Metadata = {
  title: CONTACT_PAGE.title,
  description: CONTACT_PAGE.lede,
  alternates: { canonical: '/contact' },
};

export default function Page() {
  const related = [
    { title: PRIVACY_PAGE.title, href: routes.privacy() },
    { title: TERMS_PAGE.title, href: routes.terms() },
    { title: 'سؤالات متداول', href: routes.help('faq') },
  ].filter((item) => item.title !== CONTACT_PAGE.title);

  return <ContentPageView page={CONTACT_PAGE} related={related} />;
}
