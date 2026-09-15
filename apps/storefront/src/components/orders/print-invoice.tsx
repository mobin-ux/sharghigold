'use client';

import { PrintIcon } from './order-icons';

/**
 * «چاپ یا ذخیره PDF». The browser's own print dialog, which offers «Save as
 * PDF» everywhere. The canvas promises a generated PDF file, which needs an
 * invoice service the shop does not have yet; a button that answers «در حال
 * آماده‌سازی» and never delivers is worse than this one.
 */
export function PrintInvoice() {
  return (
    <button
      className="zn-ordbtn zn-ordbtn--gold zn-ordbtn--wide"
      type="button"
      onClick={() => window.print()}
    >
      <PrintIcon />
      چاپ یا ذخیره PDF
    </button>
  );
}
