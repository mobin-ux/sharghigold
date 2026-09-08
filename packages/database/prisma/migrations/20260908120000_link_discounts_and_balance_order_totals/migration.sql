-- Close three gaps the first two migrations left open.
--
-- 1. An order recorded that a discount was applied but not which one, so a
--    redemption could not be reconciled against `discounts.redemptionCount`.
-- 2. A wallet ledger entry referenced an order by a bare string, so the only
--    route from a debit back to what it paid for could dangle silently.
-- 3. `order_items` had a CHECK that its line total matched its own unit price,
--    but `orders` had no equivalent: nothing stopped an order whose stated
--    total disagreed with the six components printed on the customer's invoice.

-- ---------------------------------------------------------------------------
-- 1. Orders reference the discount they redeemed
-- ---------------------------------------------------------------------------

ALTER TABLE "orders"
  ADD COLUMN "discountId" TEXT,
  ADD COLUMN "discountCode" TEXT;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_discountId_fkey"
  FOREIGN KEY ("discountId") REFERENCES "discounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "orders_discountId_idx" ON "orders"("discountId");

-- A discounted order must say what authorised the discount, and an order with
-- no discount must not carry a stale reference to one.
ALTER TABLE "orders"
  ADD CONSTRAINT "order_discount_reference_consistent" CHECK (
    ("discountRials" = 0 AND "discountId" IS NULL AND "discountCode" IS NULL)
    OR ("discountRials" > 0 AND "discountId" IS NOT NULL)
  );

-- ---------------------------------------------------------------------------
-- 2. Wallet ledger entries reference a real order
-- ---------------------------------------------------------------------------

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_relatedOrderId_fkey"
  FOREIGN KEY ("relatedOrderId") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "wallet_transactions_relatedOrderId_idx"
  ON "wallet_transactions"("relatedOrderId");

-- ---------------------------------------------------------------------------
-- 3. An order total must equal the components it is built from
-- ---------------------------------------------------------------------------

-- The invoice a customer receives lists the gold value, the making fee, the
-- profit, VAT, shipping and the discount, and then a total. If those two
-- disagree the order is unbillable and unauditable, and the discrepancy is
-- found by a human reading an invoice rather than by the database.
--
-- Stated as an equality rather than a tolerance: every component is a whole
-- number of rials, so there is no rounding slack to allow for.
ALTER TABLE "orders"
  ADD CONSTRAINT "order_total_consistent" CHECK (
    "totalRials" =
      "goldValueRials" + "makingFeeRials" + "profitRials" + "vatRials"
      + "shippingRials" - "discountRials"
  );

-- A discount may not exceed what is being discounted. Without this the total
-- constraint above is still satisfiable by a negative total, which
-- `order_amounts_non_negative` would then reject with a confusing message.
ALTER TABLE "orders"
  ADD CONSTRAINT "order_discount_within_subtotal" CHECK (
    "discountRials" <=
      "goldValueRials" + "makingFeeRials" + "profitRials" + "vatRials"
      + "shippingRials"
  );
