-- Domain invariants the Prisma schema language cannot express.
--
-- These live in the database on purpose. Application code is the first line of
-- defence, but the database is the last one: a bug, a migration script or a
-- future service that bypasses the ORM must still not be able to write a
-- negative price, oversell stock, or leave an order line whose total does not
-- match its own unit price.

-- Purity and weight must be real. Rates are bounded so a typo cannot turn a
-- 15% making fee into 1500%.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_karat_valid" CHECK ("karat" IN (18, 21, 22, 24)),
  ADD CONSTRAINT "product_variants_weight_positive" CHECK ("weightMilligrams" > 0),
  ADD CONSTRAINT "product_variants_making_fee_range" CHECK ("makingFeeBasisPoints" BETWEEN 0 AND 1000000),
  ADD CONSTRAINT "product_variants_profit_range" CHECK ("profitBasisPoints" BETWEEN 0 AND 1000000);

-- Stock cannot go negative, and we cannot reserve more than we physically
-- hold. This is the invariant that makes overselling a database error rather
-- than a customer-service problem.
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_on_hand_non_negative" CHECK ("quantityOnHand" >= 0),
  ADD CONSTRAINT "inventory_reserved_non_negative" CHECK ("quantityReserved" >= 0),
  ADD CONSTRAINT "inventory_reserved_within_on_hand" CHECK ("quantityReserved" <= "quantityOnHand");

ALTER TABLE "gold_price_snapshots"
  ADD CONSTRAINT "gold_price_positive" CHECK ("pricePerGramRials" > 0),
  ADD CONSTRAINT "gold_price_karat_valid" CHECK ("karat" IN (18, 21, 22, 24));

ALTER TABLE "price_quotes"
  ADD CONSTRAINT "price_quote_total_non_negative" CHECK ("totalRials" >= 0),
  ADD CONSTRAINT "price_quote_expiry_after_creation" CHECK ("expiresAt" > "createdAt");

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_item_quantity_positive" CHECK ("quantity" > 0);

-- A cart is owned by an account or by a guest token, never by neither.
ALTER TABLE "carts"
  ADD CONSTRAINT "cart_has_owner"
  CHECK ("customerId" IS NOT NULL OR "guestTokenHash" IS NOT NULL);

ALTER TABLE "orders"
  ADD CONSTRAINT "order_amounts_non_negative" CHECK (
    "goldValueRials" >= 0 AND "makingFeeRials" >= 0 AND "profitRials" >= 0 AND
    "vatRials" >= 0 AND "discountRials" >= 0 AND "shippingRials" >= 0 AND
    "totalRials" >= 0
  );

-- The line total must equal unit total times quantity. Without this, a partial
-- write or a bad recalculation can leave an order that does not add up.
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_item_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_item_weight_positive" CHECK ("weightMilligrams" > 0),
  ADD CONSTRAINT "order_item_karat_valid" CHECK ("karat" IN (18, 21, 22, 24)),
  ADD CONSTRAINT "order_item_amounts_non_negative" CHECK (
    "unitGoldValueRials" >= 0 AND "unitMakingFeeRials" >= 0 AND
    "unitProfitRials" >= 0 AND "unitVatRials" >= 0 AND
    "unitTotalRials" >= 0 AND "lineTotalRials" >= 0
  ),
  ADD CONSTRAINT "order_item_line_total_consistent"
    CHECK ("lineTotalRials" = "unitTotalRials" * "quantity");

ALTER TABLE "payments"
  ADD CONSTRAINT "payment_amount_positive" CHECK ("amountRials" > 0);

ALTER TABLE "installment_plans"
  ADD CONSTRAINT "installment_month_count_positive" CHECK ("monthCount" > 0),
  ADD CONSTRAINT "installment_principal_positive" CHECK ("principalRials" > 0),
  ADD CONSTRAINT "installment_down_payment_within_principal"
    CHECK ("downPaymentRials" >= 0 AND "downPaymentRials" <= "principalRials");

ALTER TABLE "instalments"
  ADD CONSTRAINT "instalment_amount_positive" CHECK ("amountRials" > 0),
  ADD CONSTRAINT "instalment_sequence_positive" CHECK ("sequence" > 0);

-- A wallet may not be overdrawn, and the running balance recorded on a ledger
-- entry must itself be a valid balance.
ALTER TABLE "wallets"
  ADD CONSTRAINT "wallet_balance_non_negative" CHECK ("balanceRials" >= 0);

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transaction_balance_non_negative" CHECK ("balanceAfterRials" >= 0),
  ADD CONSTRAINT "wallet_transaction_amount_non_zero" CHECK ("amountRials" <> 0);

ALTER TABLE "discounts"
  ADD CONSTRAINT "discount_window_valid" CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "discount_value_non_negative" CHECK ("value" >= 0),
  ADD CONSTRAINT "discount_minimum_non_negative" CHECK ("minimumOrderRials" >= 0),
  ADD CONSTRAINT "discount_redemptions_non_negative" CHECK ("redemptionCount" >= 0),
  ADD CONSTRAINT "discount_max_redemptions_positive"
    CHECK ("maxRedemptions" IS NULL OR "maxRedemptions" > 0),
  ADD CONSTRAINT "discount_redemptions_within_max"
    CHECK ("maxRedemptions" IS NULL OR "redemptionCount" <= "maxRedemptions");

ALTER TABLE "otp_challenges"
  ADD CONSTRAINT "otp_attempts_non_negative" CHECK ("attempts" >= 0);

-- At most one default address per customer, enforced by a partial unique
-- index rather than by application code remembering to clear the old one.
CREATE UNIQUE INDEX "addresses_one_default_per_customer"
  ON "addresses" ("customerId")
  WHERE "isDefault";
