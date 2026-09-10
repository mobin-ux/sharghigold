'use client';

import type { SizeGuideRow } from '@sharghigold/contracts';

import { BottomSheet } from '@/components/product/bottom-sheet';
import { usePurchase } from '@/components/product/purchase-context';
import { persianCount, persianDecimal } from '@/lib/product-view';

/**
 * «راهنمای سایز انگشتر» — the circumference table.
 *
 * A real `<table>`. It is two columns of numbers that mean something in
 * relation to each other, which is the case the element exists for: a screen
 * reader reads «سایز ۵۴ — ۵۴٫۴ میلی‌متر» as a row rather than as two numbers
 * that happen to be next to each other.
 */
export function SizeGuideSheet({ rows }: { readonly rows: readonly SizeGuideRow[] }) {
  const { sheet, closeSheet } = usePurchase();

  return (
    <BottomSheet open={sheet === 'size-guide'} onClose={closeSheet} title="راهنمای سایز انگشتر">
      <p className="zn-sizeguide__intro">
        دور انگشت خود را با یک نخ اندازه بگیرید و عدد به‌دست‌آمده بر حسب میلی‌متر را در جدول زیر
        پیدا کنید.
      </p>

      <table className="zn-sizeguide__table">
        <caption className="sr-only">اندازه دور انگشت به ازای هر سایز</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">سایز</th>
            <th scope="col">دور انگشت</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size}>
              <th className="zn-sizeguide__size" scope="row">
                سایز {persianCount(row.size)}
              </th>
              <td className="zn-sizeguide__mm">
                {persianDecimal(row.circumferenceMillimetres)} میلی‌متر
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </BottomSheet>
  );
}
