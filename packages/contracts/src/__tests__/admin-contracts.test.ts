import { describe, expect, it } from 'vitest';

import {
  ADMIN_PERMISSIONS,
  adminUserSchema,
  auditEntrySchema,
  can,
  DEFAULT_ADMIN_ROLES,
  permissionsOf,
  productDraftSchema,
  refundRequestSchema,
  stockAdjustmentSchema,
} from '../index.js';

/**
 * The management side, before it exists.
 *
 * What is pinned here is the handful of decisions that are expensive to
 * reverse once a panel is built on top of them: that permissions are a closed
 * set, that a deactivated account holds none of them, that a refund names an
 * order rather than an amount, and that a product draft cannot carry a price.
 */

const ACTOR = {
  isActive: true,
  permissions: ['order.read', 'customer.read'] as const,
};

describe('who may do what', () => {
  it('grants a permission the actor holds', () => {
    expect(can({ ...ACTOR, permissions: [...ACTOR.permissions] }, 'order.read')).toBe(true);
  });

  it('refuses one they do not', () => {
    expect(can({ ...ACTOR, permissions: [...ACTOR.permissions] }, 'order.refund')).toBe(false);
  });

  it('gives a deactivated account nothing, whatever its roles say', () => {
    // Deactivating is the fastest thing an owner can do when something is
    // wrong, so it has to be sufficient on its own.
    const suspended = { isActive: false, permissions: [...ADMIN_PERMISSIONS] };

    for (const permission of ADMIN_PERMISSIONS) {
      expect(can(suspended, permission), permission).toBe(false);
    }
  });

  it('flattens roles into the canonical order, without duplicates', () => {
    const merged = permissionsOf([
      { key: 'a', description: 'a', permissions: ['order.read', 'product.read'] },
      { key: 'b', description: 'b', permissions: ['product.read', 'order.refund'] },
    ]);

    expect(merged).toEqual(['product.read', 'order.read', 'order.refund']);
  });
});

describe('the roles the shop starts with', () => {
  it('gives the owner everything', () => {
    expect([...DEFAULT_ADMIN_ROLES.owner.permissions]).toEqual([...ADMIN_PERMISSIONS]);
  });

  it('keeps money and identity away from support', () => {
    // The role with the most holders and the most turnover is the one that
    // must not be able to move money or read a national id.
    const support = { isActive: true, permissions: [...DEFAULT_ADMIN_ROLES.support.permissions] };

    expect(can(support, 'order.read')).toBe(true);
    expect(can(support, 'order.refund')).toBe(false);
    expect(can(support, 'customer.read_sensitive')).toBe(false);
    expect(can(support, 'settings.write')).toBe(false);
    expect(can(support, 'admin.write')).toBe(false);
  });

  it('keeps prices and settings away from fulfilment', () => {
    const staff = { isActive: true, permissions: [...DEFAULT_ADMIN_ROLES.fulfilment.permissions] };

    expect(can(staff, 'inventory.write')).toBe(true);
    expect(can(staff, 'product.write')).toBe(false);
    expect(can(staff, 'discount.write')).toBe(false);
  });
});

describe('an administrator as the panel sees them', () => {
  const admin = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4201',
    email: 'ops@example.com',
    displayName: 'سارا محمدی',
    isActive: true,
    roleKeys: ['support'],
    permissions: ['order.read'],
    twoFactorEnabled: false,
    lastLoginAt: null,
  };

  it('is accepted as the server produces it', () => {
    expect(adminUserSchema.safeParse(admin).success).toBe(true);
  });

  it('carries no secret of any kind', () => {
    const keys = Object.keys(adminUserSchema.parse(admin));
    expect(keys.some((key) => /password|hash|secret|token|totp(?!Enabled)/i.test(key))).toBe(false);
  });

  it('refuses a permission that is not in the closed set', () => {
    expect(adminUserSchema.safeParse({ ...admin, permissions: ['order.everything'] }).success).toBe(
      false,
    );
  });
});

describe('the actions that move money or stock', () => {
  it('takes a refund as an order and a reason, never an amount', () => {
    const keys = Object.keys(refundRequestSchema.shape);

    expect(keys).toContain('orderCode');
    expect(keys.some((key) => /rial|amount|total/i.test(key))).toBe(false);
  });

  it('requires an idempotency key on a refund', () => {
    expect(
      refundRequestSchema.safeParse({ orderCode: 'ZN-88520', reason: 'کالا مرجوع شد' }).success,
    ).toBe(false);
  });

  it('takes a stock change as a delta with a reason, never an absolute', () => {
    const valid = {
      productSlug: 'classic-solitaire-ring',
      delta: -1,
      reason: 'damaged',
      note: null,
      idempotencyKey: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4201',
    };

    expect(stockAdjustmentSchema.safeParse(valid).success).toBe(true);
    // «Set stock to 4» loses the race against somebody buying the fifth one.
    expect(stockAdjustmentSchema.safeParse({ ...valid, delta: 0 }).success).toBe(false);
    expect(Object.keys(stockAdjustmentSchema.shape)).not.toContain('quantity');
  });

  it('will not let a product draft carry a price', () => {
    // A price is derived from weight, purity, fee rates and the live gold
    // rate. A panel that could type one would be a second source for it.
    const keys = Object.keys(productDraftSchema.shape);
    expect(keys.some((key) => /price|rial|total/i.test(key))).toBe(false);
    expect(keys).toContain('makingFeeBasisPoints');
  });
});

describe('the audit log', () => {
  it('takes a dotted action and a field-level diff', () => {
    const entry = {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4201',
      actorType: 'ADMIN',
      actorId: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4202',
      action: 'order.refunded',
      entityType: 'Order',
      entityId: 'ZN-88520',
      changes: { paymentState: { from: 'paid', to: 'refunded' } },
      createdAt: '2026-09-12T09:00:00.000Z',
    };

    expect(auditEntrySchema.safeParse(entry).success).toBe(true);
    expect(auditEntrySchema.safeParse({ ...entry, action: 'refunded' }).success).toBe(false);
    expect(auditEntrySchema.safeParse({ ...entry, action: 'Order.Refunded' }).success).toBe(false);
  });
});
