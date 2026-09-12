import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPageView } from '@/components/content/content-page';
import { routes } from '@/lib/routes';
import { findPage, HELP_PAGES } from '@/server/content/pages';

import '../../doc.css';

/**
 * `generateStaticParams` is what makes these five pages static HTML.
 *
 * The set is known at build time, so each one is rendered once rather than on
 * every request — which is what a buying guide should be, and is why the
 * links to them are instant.
 */
export function generateStaticParams() {
  return HELP_PAGES.map((page) => ({ topic: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly topic: string }>;
}): Promise<Metadata> {
  const page = findPage(HELP_PAGES, (await params).topic);

  if (page === undefined) return { title: 'صفحه پیدا نشد' };

  return {
    title: page.title,
    description: page.lede,
    alternates: { canonical: routes.help(page.slug) },
  };
}

/** The buying guides the footer links to. */
export default async function HelpTopicPage({
  params,
}: {
  readonly params: Promise<{ readonly topic: string }>;
}) {
  const { topic } = await params;
  const page = findPage(HELP_PAGES, topic);

  if (page === undefined) notFound();

  const related = HELP_PAGES.filter((other) => other.slug !== page.slug).map((other) => ({
    title: other.title,
    href: routes.help(other.slug),
  }));

  return <ContentPageView page={page} related={related} />;
}
