/**
 * The magazine's query strings: which page of a topic, in which order, and what
 * a reader searched for.
 *
 * Closed like the product listing's parser: a value that does not parse is
 * treated as absent, so `?sort=anything` is the newest-first archive rather
 * than an error, and a search term is bounded before any server code sees it.
 */
import { z } from 'zod';

import { slugSchema, userTextSchema } from './primitives.js';

export const magazineSortSchema = z.enum(['newest', 'popular']);
export type MagazineSort = z.output<typeof magazineSortSchema>;

export const DEFAULT_MAGAZINE_SORT: MagazineSort = 'newest';

/** Articles per archive page. */
export const MAGAZINE_PAGE_SIZE = 6;

/** Far beyond any archive the shop will write; it only bounds a crafted URL. */
export const MAGAZINE_MAX_PAGE = 100;

/** What a reader may type into the magazine search. */
export const magazineSearchTermSchema = userTextSchema(80);

export const magazineArchiveQuerySchema = z.object({
  sort: magazineSortSchema.default(DEFAULT_MAGAZINE_SORT),
  page: z.int().min(1).max(MAGAZINE_MAX_PAGE).default(1),
});
export type MagazineArchiveQuery = z.output<typeof magazineArchiveQuerySchema>;

/** A topic or author segment from the path. */
export const magazineSlugSchema = slugSchema;

type RawParams = Readonly<Record<string, string | readonly string[] | undefined>>;

function first(params: RawParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : (value as string | undefined);
}

function keep<T>(schema: z.ZodType<T>, raw: string | undefined): T | undefined {
  if (raw === undefined) return undefined;
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** `?sort=&page=` for a topic archive. Never throws. */
export function parseMagazineArchiveQuery(params: RawParams): MagazineArchiveQuery {
  return magazineArchiveQuerySchema.parse({
    sort: keep(magazineSortSchema, first(params, 'sort')),
    page: keep(z.coerce.number().int().min(1).max(MAGAZINE_MAX_PAGE), first(params, 'page')),
  });
}

/** `?q=` for the magazine search: the trimmed term, or `''` when absent or invalid. */
export function parseMagazineSearch(params: RawParams): string {
  return keep(magazineSearchTermSchema, first(params, 'q')) ?? '';
}
