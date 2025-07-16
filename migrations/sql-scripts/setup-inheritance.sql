-- Setup inheritance links SQL script
-- First check if we already have inherited links
SELECT 'Current link distribution:' as status;
SELECT "linkType",
  COUNT(*) as count
FROM category_attributes
GROUP BY "linkType";
-- Add some test data if needed
DO $$ BEGIN -- Check if we have categories and attributes
IF (
  SELECT COUNT(*)
  FROM categories
) = 0 THEN
INSERT INTO categories (id, name, description)
VALUES (
    gen_random_uuid(),
    'Electronics',
    'Electronic devices and gadgets'
  ),
  (
    gen_random_uuid(),
    'Smartphones',
    'Mobile phones and accessories'
  ),
  (
    gen_random_uuid(),
    'Laptops',
    'Laptops and notebooks'
  );
-- Set parent relationships
UPDATE categories
SET "parentId" = (
    SELECT id
    FROM categories
    WHERE name = 'Electronics'
  )
WHERE name IN ('Smartphones', 'Laptops');
END IF;
-- Check if we have attributes
IF (
  SELECT COUNT(*)
  FROM attributes
) = 0 THEN
INSERT INTO attributes (id, name, description, type)
VALUES (
    gen_random_uuid(),
    'Brand',
    'Product brand name',
    'text'
  ),
  (
    gen_random_uuid(),
    'Color',
    'Product color',
    'text'
  ),
  (
    gen_random_uuid(),
    'Weight',
    'Product weight in grams',
    'number'
  ),
  (
    gen_random_uuid(),
    'Warranty Period',
    'Warranty duration in months',
    'number'
  );
END IF;
END $$;
-- Create direct links if they don't exist
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'direct',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Electronics'
  AND a.name IN ('Brand', 'Warranty Period')
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- Now create inherited links for child categories
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  child.id,
  parent_attr.attribute_id,
  'inherited',
  NOW()
FROM categories child
  JOIN categories parent ON child."parentId" = parent.id
  JOIN (
    SELECT ca."categoryId",
      ca."attributeId" as attribute_id
    FROM category_attributes ca
    WHERE ca."linkType" = 'direct'
  ) parent_attr ON parent_attr."categoryId" = parent.id
WHERE NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = child.id
      AND ca."attributeId" = parent_attr.attribute_id
  );
-- Create global attributes
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
-- Show results
SELECT 'Final link distribution:' as status;
SELECT "linkType",
  COUNT(*) as count
FROM category_attributes
GROUP BY "linkType";
SELECT 'Inheritance hierarchy:' as status;
WITH RECURSIVE category_tree AS (
  SELECT id,
    name,
    "parentId",
    0 as level,
    name as path
  FROM categories
  WHERE "parentId" IS NULL
  UNION ALL
  SELECT c.id,
    c.name,
    c."parentId",
    ct.level + 1,
    ct.path || ' > ' || c.name
  FROM categories c
    JOIN category_tree ct ON c."parentId" = ct.id
)
SELECT ct.path,
  ca."linkType",
  a.name as attribute_name
FROM category_tree ct
  LEFT JOIN category_attributes ca ON ct.id = ca."categoryId"
  LEFT JOIN attributes a ON ca."attributeId" = a.id
ORDER BY ct.level,
  ct.name,
  ca."linkType",
  a.name;
