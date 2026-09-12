import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPageView } from '@/components/content/content-page';
import { routes } from '@/lib/routes';
import { ABOUT_PAGE, ABOUT_PAGES, findPage } from '@/server/content/pages';

import '../../doc.css';

export function generateStaticParams() {
  return ABOUT_PAGES.map((page) => ({ topic: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly topic: string }>;
}): Promise<Metadata> {
  const page = findPage(ABOUT_PAGES, (await params).topic);

  if (page === undefined) return { title: 'صفحه پیدا نشد' };

  return {
    title: page.title,
    description: page.lede,
    alternates: { canonical: routes.about(page.slug) },
  };
}

export default async function AboutTopicPage({
  params,
}: {
  readonly params: Promise<{ readonly topic: string }>;
}) {
  const { topic } = await params;
  const page = findPage(ABOUT_PAGES, topic);

  if (page === undefined) notFound();

  const related = [
    { title: ABOUT_PAGE.title, href: routes.about() },
    ...ABOUT_PAGES.filter((other) => other.slug !== page.slug).map((other) => ({
      title: other.title,
      href: routes.about(other.slug),
    })),
  ];

  return <ContentPageView page={page} related={related} />;
}
