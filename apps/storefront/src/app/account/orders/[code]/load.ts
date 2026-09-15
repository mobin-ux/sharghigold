import { orderCodeSchema, type OrderFile } from '@sharghigold/contracts';
import { notFound } from 'next/navigation';

import { requireViewer, type Viewer } from '@/server/account/session';
import { findOrderFile } from '@/server/orders/order-file';

/**
 * The signed-in customer and one of their orders, or a 404.
 *
 * Every page under `/account/orders/[code]` starts here. The code is URL text,
 * so it is shape-checked before any lookup, and the lookup reads only this
 * customer's rows: another customer's order and a made-up code are the same
 * 404, which is the only answer that does not confirm a code is real.
 */
export async function loadOrder(
  params: Promise<{ readonly code: string }>,
): Promise<{ readonly viewer: Viewer; readonly order: OrderFile; readonly now: Date }> {
  const viewer = await requireViewer();
  const { code } = await params;
  const parsed = orderCodeSchema.safeParse(code);
  const now = new Date();
  const order = parsed.success ? findOrderFile(viewer, parsed.data, now) : undefined;

  if (order === undefined) notFound();
  return { viewer, order, now };
}
