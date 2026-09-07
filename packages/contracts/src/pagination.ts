/**
 * Pagination, sorting and list envelopes.
 *
 * Limits are capped in the schema rather than the handler, so an expensive
 * query cannot be requested at all — a client asking for 10,000 rows is
 * rejected at parse time rather than politely served (rules 13 and 29).
 */
import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Offset pagination, for pages a user can jump around in.
 *
 * `coerce` is used because these arrive as query-string text.
 */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PageQuery = z.output<typeof pageQuerySchema>;

/**
 * Cursor pagination, for feeds that append.
 *
 * The product grid loads in batches as the customer scrolls; offset pagination
 * would duplicate or skip rows there whenever inventory changes mid-scroll.
 */
export const cursorQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type CursorQuery = z.output<typeof cursorQuerySchema>;

export const sortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.output<typeof sortDirectionSchema>;

/** Build a sort schema restricted to fields that are actually indexed. */
export function sortQuerySchema<const T extends readonly [string, ...string[]]>(
  sortableFields: T,
  defaultField: T[number],
  defaultDirection: SortDirection = 'desc',
) {
  return z.object({
    sortBy: z.enum(sortableFields).default(defaultField),
    sortDir: sortDirectionSchema.default(defaultDirection),
  });
}

export interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export const pageMetaSchema = z.object({
  page: z.int().min(1),
  pageSize: z.int().min(1),
  totalItems: z.int().min(0),
  totalPages: z.int().min(0),
});

export function pagedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    meta: pageMetaSchema,
  });
}

export function cursorPagedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export function buildPageMeta(page: number, pageSize: number, totalItems: number): PageMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0,
  };
}
