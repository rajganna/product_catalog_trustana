-- Apply AddProductSearchOptimization migration
-- Add search optimization columns to products table
ALTER TABLE "products"
ADD COLUMN "searchVector" text,
  ADD COLUMN "categoryPath" varchar(1000),
  ADD COLUMN "priceRange" varchar(50),
  ADD COLUMN "attributeIndex" jsonb,
  ADD COLUMN "tags" varchar(500),
  ADD COLUMN "searchScore" numeric DEFAULT 0;
-- Add comments
COMMENT ON COLUMN "products"."searchVector" IS 'Concatenated searchable text for full-text search';
COMMENT ON COLUMN "products"."categoryPath" IS 'Precomputed category hierarchy path';
COMMENT ON COLUMN "products"."priceRange" IS 'Precomputed price range bucket';
COMMENT ON COLUMN "products"."attributeIndex" IS 'Flattened attribute key-value pairs for fast filtering';
COMMENT ON COLUMN "products"."tags" IS 'Comma-separated searchable tags';
COMMENT ON COLUMN "products"."searchScore" IS 'Relevance score for search ranking';
-- Create indexes for products
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_SEARCH_VECTOR" ON "products" ("searchVector");
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_CATEGORY_PATH" ON "products" ("categoryPath");
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_PRICE_RANGE" ON "products" ("priceRange");
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_SEARCH_SCORE" ON "products" ("searchScore");
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_ACTIVE_CATEGORY" ON "products" ("isActive", "categoryId");
-- Create GIN index for JSONB attribute index (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_ATTRIBUTE_INDEX_GIN" ON "products" USING GIN ("attributeIndex");
-- Create full-text search index for searchVector (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_SEARCH_VECTOR_FTS" ON "products" USING GIN (
  to_tsvector('english', COALESCE("searchVector", ''))
);
-- Add search optimization columns to attributes table
ALTER TABLE "attributes"
ADD COLUMN "searchVector" text,
  ADD COLUMN "categoryPaths" text,
  ADD COLUMN "relevanceScore" numeric DEFAULT 0;
-- Record these migrations as applied
INSERT INTO migrations (id, timestamp, name)
VALUES (
    2,
    1672531200000,
    'AddProductSearchOptimization1672531200000'
  ),
  (
    3,
    1672531300000,
    'CreateAttributeSearchOptimization1672531300000'
  );
-- Show progress
SELECT 'Product search optimization columns and indexes added' as status;
SELECT 'Attribute search optimization columns added' as status;
