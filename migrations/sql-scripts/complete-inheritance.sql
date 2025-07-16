-- Clean up duplicate categories and complete the inheritance setup
-- First remove duplicate Electronics categories
DELETE FROM category_attributes
WHERE "categoryId" IN (
    SELECT id
    FROM categories
    WHERE name = 'Electronics'
      AND id NOT IN (
        SELECT id
        FROM categories
        WHERE name = 'Electronics'
        ORDER BY id
        LIMIT 1
      )
  );
DELETE FROM categories
WHERE name = 'Electronics'
  AND id NOT IN (
    SELECT id
    FROM categories
    WHERE name = 'Electronics'
    ORDER BY id
    LIMIT 1
  );
-- Add global attributes for Color and Weight
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  NULL,
  a.id,
  'global',
  NOW()
FROM attributes a
WHERE a.name IN ('Color', 'Weight')
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."attributeId" = a.id
      AND ca."linkType" = 'global'
  );
-- Final status report
SELECT 'Final category hierarchy:' as info;
SELECT c.name as category,
  COALESCE(p.name, 'ROOT') as parent_category
FROM categories c
  LEFT JOIN categories p ON c."parentId" = p.id
ORDER BY c."parentId" NULLS FIRST,
  c.name;
SELECT 'Final link distribution:' as info;
SELECT "linkType",
  COUNT(*) as count
FROM category_attributes
GROUP BY "linkType"
ORDER BY "linkType";
SELECT 'Complete inheritance mapping:' as info;
SELECT COALESCE(c.name, 'GLOBAL') as category,
  a.name as attribute,
  ca."linkType"
FROM category_attributes ca
  LEFT JOIN categories c ON ca."categoryId" = c.id
  JOIN attributes a ON ca."attributeId" = a.id
ORDER BY CASE
    WHEN c.name IS NULL THEN 'ZZZ_GLOBAL'
    ELSE c.name
  END,
  ca."linkType",
  a.name;
