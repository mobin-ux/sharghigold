import type { Metadata } from 'next';
import { parseMagazineArchiveQuery } from '@sharghigold/contracts';

import { ArchiveView } from '@/components/magazine/archive-view';
import { routes } from '@/lib/routes';
import { ALL_TOPICS } from '@/server/content/magazine';

import '../magazine.css';

export const metadata: Metadata = {
  title: ALL_TOPICS.label,
  description: ALL_TOPICS.description,
  alternates: { canonical: routes.blogTopic() },
};

/** Every article, newest or most-read first, a page at a time. */
export default async function AllArticlesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  return <ArchiveView topic={null} query={parseMagazineArchiveQuery(await searchParams)} />;
}
