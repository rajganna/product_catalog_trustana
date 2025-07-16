-- Comprehensive validation and demonstration of the test dataset
-- This shows how inheritance works across our category hierarchy
-- 1. Show the clean category hierarchy
SELECT '=== CATEGORY HIERARCHY ===' as section;
WITH RECURSIVE category_tree AS (
  SELECT id,
    name,
    "parentId",
    0 as level,
    name::text as path
  FROM categories
  WHERE "parentId" IS NULL
  UNION ALL
  SELECT c.id,
    c.name,
    c."parentId",
    ct.level + 1,
    ct.path || ' > ' || c.name::text
  FROM categories c
    JOIN category_tree ct ON c."parentId" = ct.id
  WHERE ct.level < 5
)
SELECT REPEAT('  ', level) || name as hierarchy,
  level,
  (
    SELECT COUNT(*)
    FROM products p
    WHERE p."categoryId" = ct.id
  ) as products
FROM category_tree ct
ORDER BY path;
-- 2. Show inheritance summary
SELECT '=== INHERITANCE SUMMARY ===' as section;
SELECT "linkType",
  COUNT(*) as total_links,
  COUNT(DISTINCT "categoryId") as categories_with_links,
  COUNT(DISTINCT "attributeId") as unique_attributes
FROM category_attributes
GROUP BY "linkType"
ORDER BY "linkType";
-- 3. Show attribute distribution by category
SELECT '=== ATTRIBUTE DISTRIBUTION ===' as section;
SELECT c.name as category,
  COUNT(
    CASE
      WHEN ca."linkType" = 'direct' THEN 1
    END
  ) as direct_attrs,
  COUNT(
    CASE
      WHEN ca."linkType" = 'inherited' THEN 1
    END
  ) as inherited_attrs,
  COUNT(
    CASE
      WHEN ca."linkType" = 'global' THEN 1
    END
  ) as global_attrs,
  COUNT(ca.id) as total_attrs
FROM categories c
  LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
GROUP BY c.id,
  c.name
ORDER BY total_attrs DESC,
  c.name;
-- 4. Show products by category with their attribute coverage
SELECT '=== PRODUCT ATTRIBUTE COVERAGE ===' as section;
SELECT c.name as category,
  p.name as product,
  p.price,
  COUNT(pav.id) as attributes_set,
  COUNT(ca.id) as available_attributes
FROM products p
  JOIN categories c ON p."categoryId" = c.id
  LEFT JOIN product_attribute_values pav ON p.id = pav."productId"
  LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
GROUP BY p.id,
  p.name,
  c.name,
  p.price
ORDER BY c.name,
  p.name;
-- 5. Detailed inheritance example for a specific product
SELECT '=== INHERITANCE EXAMPLE: iPhone 15 Pro ===' as section;
WITH iphone_category AS (
  SELECT p.id as product_id,
    p.name as product_name,
    c.id as category_id,
    c.name as category_name
  FROM products p
    JOIN categories c ON p."categoryId" = c.id
  WHERE p.name = 'iPhone 15 Pro'
),
available_attributes AS (
  SELECT DISTINCT a.id,
    a.name,
    a.type,
    ca."linkType",
    CASE
      WHEN ca."linkType" = 'direct' THEN ic.category_name
      WHEN ca."linkType" = 'inherited' THEN (
        -- Find the source category for inherited attributes
        WITH RECURSIVE parent_search AS (
          SELECT c.id,
            c.name,
            c."parentId"
          FROM categories c
          WHERE c.id = ic.category_id
          UNION ALL
          SELECT c.id,
            c.name,
            c."parentId"
          FROM categories c
            JOIN parent_search ps ON c.id = ps."parentId"
        )
        SELECT ps.name
        FROM parent_search ps
          JOIN category_attributes source_ca ON source_ca."categoryId" = ps.id
          AND source_ca."attributeId" = a.id
          AND source_ca."linkType" = 'direct'
        LIMIT 1
      )
      WHEN ca."linkType" = 'global' THEN 'Global'
    END as source_category
  FROM iphone_category ic
    JOIN category_attributes ca ON ca."categoryId" = ic.category_id
    JOIN attributes a ON ca."attributeId" = a.id
),
attribute_values AS (
  SELECT pav."attributeId",
    pav.value
  FROM iphone_category ic
    JOIN product_attribute_values pav ON pav."productId" = ic.product_id
)
SELECT aa.name as attribute_name,
  aa.type,
  aa."linkType",
  aa.source_category,
  COALESCE(av.value::text, '(not set)') as current_value
FROM available_attributes aa
  LEFT JOIN attribute_values av ON aa.id = av."attributeId"
ORDER BY CASE
    aa."linkType"
    WHEN 'direct' THEN 1
    WHEN 'inherited' THEN 2
    WHEN 'global' THEN 3
  END,
  aa.name;
-- 6. Show materialized views status
SELECT '=== MATERIALIZED VIEWS STATUS ===' as section;
SELECT matviewname,
  ispopulated,
  hasindexes
FROM pg_matviews
WHERE matviewname LIKE 'mv_%'
ORDER BY matviewname;
-- 7. Final summary
SELECT '=== FINAL SUMMARY ===' as section;
SELECT (
    SELECT COUNT(*)
    FROM categories
  ) as total_categories,
  (
    SELECT COUNT(*)
    FROM products
  ) as total_products,
  (
    SELECT COUNT(*)
    FROM attributes
  ) as total_attributes,
  (
    SELECT COUNT(*)
    FROM category_attributes
  ) as total_attribute_links,
  (
    SELECT COUNT(*)
    FROM product_attribute_values
  ) as total_product_attribute_values;
