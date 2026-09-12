/**
 * The management side: who may do what, and the shapes the admin panel reads
 * and writes.
 *
 * The panel does not exist yet. This file does, because the decisions it
 * encodes are the ones that are expensive to change once it does — and because
 * two of them have to be made *before* the panel is built, not after.
 *
 * **Permissions are a closed set defined here, not rows an administrator can
 * invent.** The database has a `permissions` table, and it is seeded from this
 * list. A permission that can be created at runtime is a permission no code
 * checks for, and «grant yourself a new permission» is the shortest path from
 * a compromised admin account to a compromised shop. Roles are data; what a
 * role may contain is not.
 *
 * **Nothing here is the storefront's business.** The storefront never imports
 * this file. It is shared between the API and the admin panel, which is why it
 * lives in `contracts` rather than in either of them — the day the panel is
 * built it must not be free to invent its own idea of what «refund an order»
 * means.
 *
 * A note on money, which applies to every figure the panel shows: amounts are
 * strings of whole rials, as everywhere else. An admin dashboard that renders
 * revenue as a double is an admin dashboard whose totals do not match the
 * ledger it is summarising.
 */
import { z } from 'zod';

import { orderPaymentStateSchema } from './cart.js';
import { rialsStringSchema, slugSchema, userTextSchema, uuidSchema } from './primitives.js';

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Every action the management side can be granted.
 *
 * Dotted `subject.verb`, matching the `permissions.key` column. Read and write
 * are separate on purpose: most staff need to *see* orders and almost none
 * need to refund one, and a single `order.manage` collapses that distinction
 * on the day somebody is added in a hurry.
 *
 * Three of these are deliberately their own permission rather than part of a
 * larger one, because each is a way to take money or to hide having taken it:
 * `order.refund`, `discount.write` and `settings.write`. A fourth,
 * `audit.read`, is separate because reading the log of what everyone did is
 * not something every role should have.
 */
export const ADMIN_PERMISSIONS = [
  'product.read',
  'product.write',
  /** Making a draft visible to customers. Separate from editing it. */
  'product.publish',
  'inventory.read',
  'inventory.write',
  'order.read',
  'order.write',
  /** Moving money back to a customer. Its own permission, always. */
  'order.refund',
  'customer.read',
  /** Includes the national id and the bank details, so it is not `customer.read`. */
  'customer.read_sensitive',
  'customer.write',
  'discount.read',
  'discount.write',
  'content.read',
  'content.write',
  'report.read',
  'settings.read',
  /** Gold rate source, fee rates, instalment terms, delivery charges. */
  'settings.write',
  'admin.read',
  /** Creating administrators and granting roles. The keys to the building. */
  'admin.write',
  'audit.read',
] as const;

export const adminPermissionSchema = z.enum(ADMIN_PERMISSIONS);

export type AdminPermission = z.output<typeof adminPermissionSchema>;

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The roles the shop starts with, and what each one may do.
 *
 * Seed data, not a ceiling: a role is a row, and an owner may create more. But
 * these four are written down because they are the ones that have to be right
 * on day one, and because «what can a support agent do» is a question with a
 * security answer rather than a convenience answer.
 *
 * `support` can read a customer but not their national id, can read orders but
 * not refund them, and cannot touch a price. That is deliberately narrow: the
 * support role is the one with the most holders and the most turnover.
 */
export const DEFAULT_ADMIN_ROLES = {
  owner: {
    description: 'دسترسی کامل، شامل مدیریت کاربران و تنظیمات مالی',
    permissions: ADMIN_PERMISSIONS,
  },
  merchandiser: {
    description: 'مدیریت کالا، موجودی، دسته‌بندی و محتوا',
    permissions: [
      'product.read',
      'product.write',
      'product.publish',
      'inventory.read',
      'inventory.write',
      'content.read',
      'content.write',
      'discount.read',
      'report.read',
    ],
  },
  fulfilment: {
    description: 'پردازش سفارش‌ها و موجودی انبار',
    permissions: [
      'order.read',
      'order.write',
      'inventory.read',
      'inventory.write',
      'customer.read',
      'product.read',
    ],
  },
  support: {
    description: 'پاسخ‌گویی به مشتریان؛ بدون دسترسی به اطلاعات حساس و بازگشت وجه',
    permissions: ['order.read', 'customer.read', 'product.read', 'content.read'],
  },
} as const satisfies Record<
  string,
  { readonly description: string; readonly permissions: readonly AdminPermission[] }
>;

export type DefaultAdminRole = keyof typeof DEFAULT_ADMIN_ROLES;

export const adminRoleSchema = z.object({
  /** Stable machine key. Roles are looked up by this, never by description. */
  key: slugSchema,
  description: userTextSchema(200),
  permissions: z.array(adminPermissionSchema).max(ADMIN_PERMISSIONS.length),
});

export type AdminRole = z.output<typeof adminRoleSchema>;

/* -------------------------------------------------------------------------- */
/* The administrator                                                          */
/* -------------------------------------------------------------------------- */

/**
 * An administrator as the panel sees them.
 *
 * Carries no secret of any kind: no password hash, no TOTP secret, not even
 * whether a TOTP secret exists in a form that could be probed. Two-factor is
 * reported as a boolean because the panel has to show «not yet enabled»
 * somewhere, and that is the whole of what it needs.
 *
 * `permissions` is the flattened union of the roles, computed on the server.
 * Sending roles and asking the panel to flatten them would put the rule in two
 * places, and the client's copy is the one an attacker edits.
 */
export const adminUserSchema = z.object({
  id: uuidSchema,
  email: z.email({ message: 'ایمیل معتبر نیست' }),
  displayName: userTextSchema(80),
  isActive: z.boolean(),
  roleKeys: z.array(slugSchema).max(16),
  permissions: z.array(adminPermissionSchema),
  twoFactorEnabled: z.boolean(),
  lastLoginAt: z.iso.datetime().nullable(),
});

export type AdminUser = z.output<typeof adminUserSchema>;

/**
 * Does this administrator hold this permission?
 *
 * Shared so that the panel greys out a control and the API refuses the request
 * using the same function — and stated plainly: the panel's copy is a
 * courtesy. The API calls this on the request, against permissions it loaded
 * itself, and a hidden button is never the reason something did not happen.
 */
export function can(
  actor: {
    readonly isActive: boolean;
    /** Readonly, so a caller holding a frozen list is not forced to copy it. */
    readonly permissions: readonly AdminPermission[];
  },
  permission: AdminPermission,
): boolean {
  // A deactivated account holds no permission at all, whatever its roles say.
  // Deactivating is the fastest thing an owner can do when something is wrong,
  // and it has to be sufficient on its own.
  return actor.isActive && actor.permissions.includes(permission);
}

/** Every permission a set of roles adds up to, in the canonical order. */
export function permissionsOf(roles: readonly AdminRole[]): readonly AdminPermission[] {
  const held = new Set(roles.flatMap((role) => role.permissions));
  return ADMIN_PERMISSIONS.filter((permission) => held.has(permission));
}

/* -------------------------------------------------------------------------- */
/* The audit log                                                              */
/* -------------------------------------------------------------------------- */

export const actorTypeSchema = z.enum(['ADMIN', 'CUSTOMER', 'SYSTEM']);

/**
 * One thing somebody did.
 *
 * `changes` is a field-level diff, never a row dump, and it is redacted before
 * it is written — a log that records the old and new value of every column is
 * a log that contains a national id in plain text and is read by more people
 * than the table it came from.
 *
 * There is no `delete` in the admin contracts for this reason and one other:
 * every destructive action in this system is a state change with a record, so
 * «who cancelled this order» always has an answer.
 */
export const auditEntrySchema = z.object({
  id: uuidSchema,
  actorType: actorTypeSchema,
  actorId: uuidSchema.nullable(),
  /** Dotted, e.g. `order.refunded` or `admin.role_granted`. */
  action: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/, { message: 'شناسه رویداد معتبر نیست' }),
  entityType: z.string().min(1).max(40),
  entityId: z.string().max(64).nullable(),
  changes: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.iso.datetime(),
});

export type AuditEntry = z.output<typeof auditEntrySchema>;

/* -------------------------------------------------------------------------- */
/* What the dashboard shows                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A figure on the dashboard, with the window it was measured over.
 *
 * The window travels with the number rather than being implied by the heading.
 * «۲٫۴ میلیارد» over an unstated period is not a fact, and a card whose
 * heading and query drift apart reports last week's revenue as today's.
 */
export const metricSchema = z.object({
  key: z.string().min(1).max(40),
  /** Whole rials as a string, or a plain count. Never a float. */
  value: z.union([rialsStringSchema, z.int()]),
  unit: z.enum(['rials', 'count', 'milligrams']),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  /** The same measure over the preceding window, for a comparison. */
  previousValue: z.union([rialsStringSchema, z.int()]).nullable(),
});

export type Metric = z.output<typeof metricSchema>;

export const dashboardSchema = z.object({
  metrics: z.array(metricSchema).max(24),
  /** Orders whose payment has not resolved, which is what needs attention. */
  pendingPayments: z.int().min(0),
  /** Pieces at or below their reorder point. */
  lowStock: z.int().min(0),
});

export type Dashboard = z.output<typeof dashboardSchema>;

/* -------------------------------------------------------------------------- */
/* Managing an order                                                          */
/* -------------------------------------------------------------------------- */

/**
 * An order in the management list.
 *
 * Deliberately not the customer's own view of the same order. The panel needs
 * the customer's identity and the payment state; the customer's page needs
 * neither of those spelled out the same way. One schema serving both is how an
 * internal field ends up on a page a customer can read.
 */
export const adminOrderSummarySchema = z.object({
  code: z.string().regex(/^ZN-\d{4,10}$/, { message: 'شماره سفارش معتبر نیست' }),
  placedAt: z.iso.datetime(),
  customerId: uuidSchema,
  customerName: userTextSchema(80).nullable(),
  paymentState: orderPaymentStateSchema,
  totalRials: rialsStringSchema,
  itemCount: z.int().min(1),
  /** Where the goods are, which is not where the money is. */
  fulfilmentState: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
});

export type AdminOrderSummary = z.output<typeof adminOrderSummarySchema>;

/**
 * A refund, as requested by the panel.
 *
 * The amount is *not* taken from this request. It names the order and a
 * reason; the server computes what is owed from the order it holds, because a
 * refund amount that arrives in a request body is an amount an attacker — or a
 * mistyped form — chooses. `idempotencyKey` is required rather than optional:
 * a refund is the one action in the system where a double submission moves
 * money twice.
 */
export const refundRequestSchema = z.object({
  orderCode: adminOrderSummarySchema.shape.code,
  reason: userTextSchema(200),
  idempotencyKey: uuidSchema,
});

export type RefundRequest = z.output<typeof refundRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Managing a product                                                         */
/* -------------------------------------------------------------------------- */

export const productStatusSchema = z.enum(['draft', 'published', 'archived']);

/**
 * What the panel may change about a product.
 *
 * Note what is absent: a price. A product has a weight, a purity and fee
 * rates, and its price is derived from those and the live gold rate. A panel
 * that could type a price would be a panel that can sell gold below its market
 * value by typo — and the storefront would have two sources for the same
 * number, which is the bug this whole codebase is arranged to avoid.
 */
export const productDraftSchema = z.object({
  slug: slugSchema,
  title: userTextSchema(120),
  categorySlug: slugSchema,
  subTypeSlug: slugSchema,
  karat: z.union([z.literal(18), z.literal(21), z.literal(22), z.literal(24)]),
  weightMilligrams: z.string().regex(/^\d+$/, { message: 'وزن باید عدد صحیح باشد' }),
  weightToleranceMilligrams: z.string().regex(/^\d+$/, { message: 'رواداری وزن معتبر نیست' }),
  /** اجرت, in basis points of the gold value. */
  makingFeeBasisPoints: z.int().min(0).max(20_000),
  /** A reduced fee while the piece is on offer. Null clears the offer. */
  promotionalMakingFeeBasisPoints: z.int().min(0).max(20_000).nullable(),
  description: userTextSchema(2_000),
  status: productStatusSchema,
});

export type ProductDraft = z.output<typeof productDraftSchema>;

/**
 * A stock movement.
 *
 * A delta and a reason, never an absolute figure. «Set stock to 4» loses the
 * race against a customer buying the fifth one between the read and the write;
 * «take one away, because it was damaged» does not, and it leaves a record of
 * why the shelf changed.
 */
export const stockAdjustmentSchema = z.object({
  productSlug: slugSchema,
  delta: z
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((value) => value !== 0, {
      message: 'تغییر موجودی نمی‌تواند صفر باشد',
    }),
  reason: z.enum(['received', 'damaged', 'lost', 'correction', 'returned']),
  note: userTextSchema(200).nullable(),
  idempotencyKey: uuidSchema,
});

export type StockAdjustment = z.output<typeof stockAdjustmentSchema>;
