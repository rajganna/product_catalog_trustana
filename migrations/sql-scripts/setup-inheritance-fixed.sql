-- Clean setup with proper hierarchy
-- First, clean up duplicate categories
DELETE FROM categories
WHERE name = 'Electronics'
  AND id != (
    SELECT MIN(id)
    FROM categories
    WHERE name = 'Electronics'
  );
-- Add child categories with proper parent relationships
INSERT INTO categories (id, name, description, "parentId")
VALUES (
    gen_random_uuid(),
    'Smartphones',
    'Mobile phones and accessories',
    (
      SELECT id
      FROM categories
      WHERE name = 'Electronics'
      LIMIT 1
    )
  ), (
    gen_random_uuid(), 'Laptops', 'Laptops and notebooks', (
      SELECT id
      FROM categories
      WHERE name = 'Electronics'
      LIMIT 1
    )
  ) ON CONFLICT DO NOTHING;
-- Show current category hierarchy
SELECT 'Category hierarchy:' as info;
SELECT c.name,
  CASE
    WHEN c."parentId" IS NULL THEN 'Root'
    ELSE p.name
  END as parent
FROM categories c
  LEFT JOIN categories p ON c."parentId" = p.id
ORDER BY c."parentId" NULLS FIRST,
  c.name;
-- Create inherited links for child categories
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  child.id,
  ca."attributeId",
  'inherited',
  NOW()
FROM categories child
  JOIN categories parent ON child."parentId" = parent.id
  JOIN category_attributes ca ON ca."categoryId" = parent.id
  AND ca."linkType" = 'direct'
WHERE NOT EXISTS (
    SELECT 1
    FROM category_attributes existing
    WHERE existing."categoryId" = child.id
      AND existing."attributeId" = ca."attributeId"
  );
-- Create global attributes for Color and Weight
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
-- Show final results
SELECT 'Link type distribution:' as info;
SELECT "linkType",
  COUNT(*) as count
FROM category_attributes
GROUP BY "linkType"
ORDER BY "linkType";
SELECT 'Detailed inheritance mapping:' as info;
SELECT COALESCE(c.name, 'GLOBAL') as category,
  a.name as attribute,
  ca."linkType"
FROM category_attributes ca
  LEFT JOIN categories c ON ca."categoryId" = c.id
  JOIN attributes a ON ca."attributeId" = a.id
ORDER BY c.name NULLS LAST,
  ca."linkType",
  a.name;
