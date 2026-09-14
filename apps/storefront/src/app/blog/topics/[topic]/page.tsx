import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseMagazineArchiveQuery } from '@sharghigold/contracts';

import { ArchiveView } from '@/components/magazine/archive-view';
import { routes } from '@/lib/routes';
import { findTopic } from '@/server/content/magazine';

import '../../magazine.css';

type Params = Promise<{ readonly topic: string }>;

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const topic = findTopic((await params).topic);

  if (topic === undefined) return { title: 'موضوع پیدا نشد' };

  return {
    title: topic.label,
    description: topic.description,
    alternates: { canonical: routes.blogTopic(topic.slug) },
  };
}

/** One topic's articles. An unknown topic is a 404, not the whole archive. */
export default async function TopicArchivePage({
  params,
  searchParams,
}: {
  readonly params: Params;
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}) {
  const topic = findTopic((await params).topic);

  if (topic === undefined) notFound();

  return <ArchiveView topic={topic} query={parseMagazineArchiveQuery(await searchParams)} />;
}
