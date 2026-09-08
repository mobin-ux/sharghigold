/**
 * The browsable shape of the catalogue: categories, and the facets that lead
 * into a listing.
 *
 * This is the contract behind the category browser. It is deliberately *data*
 * rather than markup: a category, its product count, and the tiles a customer
 * can tap to narrow a listing are all things a merchandiser changes without a
 * deploy, so none of them may live in a React component (rule 7).
 *
 * What is *not* in here is the artwork. Each tile names an `icon` key and the
 * storefront maps that key to a drawing it owns. A vector illustration is not
 * business data, it cannot be authored in an admin form, and putting SVG paths
 * behind an API would let whoever edits a category inject markup into every
 * customer's page. The key is an opaque, constrained token; an unknown one
 * falls back to a neutral mark rather than failing the page.
 */
import { z } from 'zod';

import { slugSchema, userTextSchema } from './primitives.js';

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Names one of the storefront's drawings, e.g. `earring` or `earring.hoop`.
 *
 * Constrained rather than free text on purpose: this value is chosen by
 * whoever edits a category, and it is used to look up a component. Restricting
 * it to dotted lower-case segments means it can never be anything but a key.
 */
export const iconKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/, {
    message: 'شناسه آیکون معتبر نیست',
  });

export type IconKey = z.output<typeof iconKeySchema>;

/* -------------------------------------------------------------------------- */
/* Facets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The kinds of grouping the browser understands.
 *
 * A closed set, because each one has a heading and an ordering the storefront
 * decides. Adding a kind is a code change; adding a *tile* to an existing kind
 * is not.
 */
export const facetGroupKindSchema = z.enum([
  /** Sub-types of the category itself — «آویز», «حلقه‌ای». */
  'models',
  /** Price bands. */
  'budget',
  /** Weight bands. */
  'weight',
  /** A curated collection specific to this category, e.g. bridal sets. */
  'collection',
  /** Today's promotions. */
  'offers',
  /** Installment terms. */
  'installment',
]);

export type FacetGroupKind = z.output<typeof facetGroupKindSchema>;

/**
 * Listing filters carried by a tile, as query parameters.
 *
 * A flat string map rather than typed filter objects: the listing page owns
 * what a filter means and re-parses every parameter server-side before it
 * touches a query. Passing them through as opaque strings keeps this contract
 * from having to grow a case for every filter the catalogue ever gains, and
 * keeps the client from being trusted to interpret them.
 */
export const facetQuerySchema = z.record(
  z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z][a-zA-Z0-9]*$/, { message: 'نام پارامتر معتبر نیست' }),
  z.string().min(1).max(64),
);

export const facetTileSchema = z.object({
  label: userTextSchema(60),
  /** The category the tile lands on. */
  slug: slugSchema,
  query: facetQuerySchema,
  /** `null` renders the neutral «همه کالاها» mark. */
  icon: iconKeySchema.nullable(),
});

export type FacetTile = z.output<typeof facetTileSchema>;

export const facetGroupSchema = z.object({
  kind: facetGroupKindSchema,
  title: userTextSchema(60),
  tiles: z.array(facetTileSchema).min(1).max(24),
});

export type FacetGroup = z.output<typeof facetGroupSchema>;

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const categorySummarySchema = z.object({
  slug: slugSchema,
  title: userTextSchema(40),
  icon: iconKeySchema,
  /**
   * Published, in-stock products in this category and its descendants.
   *
   * A count, not a label: the storefront formats it into Persian numerals at
   * render time. Sending «۲۴۸» would make the number unusable for anything
   * else and would bake a locale into the API.
   */
  productCount: z.int().min(0),
});

export type CategorySummary = z.output<typeof categorySummarySchema>;

export const categoryNavigationEntrySchema = categorySummarySchema.extend({
  /** Whether to offer the installment banner for this category. */
  installmentEligible: z.boolean(),
  groups: z.array(facetGroupSchema).min(1).max(12),
});

export type CategoryNavigationEntry = z.output<typeof categoryNavigationEntrySchema>;

/** The whole browser in one response: every top-level category, in order. */
export const categoryNavigationSchema = z.object({
  categories: z.array(categoryNavigationEntrySchema).min(1).max(40),
});

export type CategoryNavigation = z.output<typeof categoryNavigationSchema>;
