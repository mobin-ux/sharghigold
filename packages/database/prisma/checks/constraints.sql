\set ON_ERROR_STOP on
BEGIN;

INSERT INTO categories(id,slug,title,"sortOrder","isActive","createdAt","updatedAt")
VALUES ('cat1','t','Test',0,true,now(),now());
INSERT INTO products(id,slug,title,"categoryId",status,"isInstallmentEligible","createdAt","updatedAt")
VALUES ('prd1','t','Test','cat1','PUBLISHED',false,now(),now());
INSERT INTO product_variants(id,"productId",sku,karat,"weightMilligrams","makingFeeBasisPoints","profitBasisPoints","isActive","createdAt","updatedAt")
VALUES ('var1','prd1','SKU1',18,1800,1500,700,true,now(),now());
INSERT INTO inventory_items(id,"variantId","quantityOnHand","quantityReserved",version,"updatedAt")
VALUES ('inv1','var1',5,2,0,now());
INSERT INTO customers(id,mobile,status,"createdAt","updatedAt")
VALUES ('cus1','09123456789','ACTIVE',now(),now());
INSERT INTO addresses(id,"customerId","recipientName",mobile,province,city,"postalCode",line,"isDefault","createdAt","updatedAt")
VALUES ('adr1','cus1','A','09123456789','تهران','تهران','1234567890','x',true,now(),now());

DO $$
DECLARE failures int := 0;
BEGIN
  -- 1: reserve more stock than we hold
  BEGIN
    UPDATE inventory_items SET "quantityReserved" = 99 WHERE id='inv1';
    RAISE NOTICE 'FAIL: oversell was allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : oversell rejected';
  END;

  -- 2: negative stock
  BEGIN
    UPDATE inventory_items SET "quantityOnHand" = -1, "quantityReserved" = 0 WHERE id='inv1';
    RAISE NOTICE 'FAIL: negative stock was allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : negative stock rejected';
  END;

  -- 3: invalid purity
  BEGIN
    INSERT INTO product_variants(id,"productId",sku,karat,"weightMilligrams","makingFeeBasisPoints","profitBasisPoints","isActive","createdAt","updatedAt")
    VALUES ('var2','prd1','SKU2',19,1800,1500,700,true,now(),now());
    RAISE NOTICE 'FAIL: karat 19 was allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : invalid karat rejected';
  END;

  -- 4: zero weight
  BEGIN
    INSERT INTO product_variants(id,"productId",sku,karat,"weightMilligrams","makingFeeBasisPoints","profitBasisPoints","isActive","createdAt","updatedAt")
    VALUES ('var3','prd1','SKU3',18,0,1500,700,true,now(),now());
    RAISE NOTICE 'FAIL: zero weight was allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : zero weight rejected';
  END;

  -- 5: negative gold price
  BEGIN
    INSERT INTO gold_price_snapshots(id,karat,"pricePerGramRials",source,"observedAt","createdAt")
    VALUES ('gp1',18,-1,'FEED',now(),now());
    RAISE NOTICE 'FAIL: negative gold price was allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : negative gold price rejected';
  END;

  -- 6: a second default address for the same customer
  BEGIN
    INSERT INTO addresses(id,"customerId","recipientName",mobile,province,city,"postalCode",line,"isDefault","createdAt","updatedAt")
    VALUES ('adr2','cus1','B','09123456789','تهران','تهران','1234567890','y',true,now(),now());
    RAISE NOTICE 'FAIL: two default addresses allowed'; failures := failures + 1;
  EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'OK  : second default address rejected';
  END;

  -- 7: a cart owned by nobody
  BEGIN
    INSERT INTO carts(id,"createdAt","updatedAt","expiresAt")
    VALUES ('crt1',now(),now(),now()+interval '1 day');
    RAISE NOTICE 'FAIL: ownerless cart allowed'; failures := failures + 1;
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK  : ownerless cart rejected';
  END;

  IF failures > 0 THEN
    RAISE EXCEPTION '% constraint(s) did not fire', failures;
  END IF;
  RAISE NOTICE '--- all constraints fired correctly ---';
END $$;

ROLLBACK;
