-- Fix category hierarchy and clean up duplicates
-- This script will establish a proper hierarchy for demonstration
-- First, identify the correct Electronics parent category (the one that should be the root)
-- We'll keep the one that has children already assigned
WITH correct_electronics AS (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'Electronics'
    AND EXISTS (
      SELECT 1
      FROM categories child
      WHERE child."parentId" = c.id
    )
  LIMIT 1
), duplicate_electronics AS (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'Electronics'
    AND c.id NOT IN (
      SELECT id
      FROM correct_electronics
    )
) -- Delete duplicate Electronics categories
DELETE FROM categories
WHERE id IN (
    SELECT id
    FROM duplicate_electronics
  );
-- Now get the correct Electronics ID for parent relationships
WITH electronics_id AS (
  SELECT id
  FROM categories
  WHERE name = 'Electronics'
  LIMIT 1
) -- Fix parent relationships for categories that should be under other parents
UPDATE categories
SET "parentId" = (
    CASE
      -- Desktop PCs should be under Computing
      WHEN name = 'Desktop PCs' THEN (
        SELECT id
        FROM categories
        WHERE name = 'Computing'
      ) -- Tablets should be under Mobile Devices
      WHEN name = 'Tablets' THEN (
        SELECT id
        FROM categories
        WHERE name = 'Mobile Devices'
      ) -- Consoles should be under Gaming
      WHEN name = 'Consoles' THEN (
        SELECT id
        FROM categories
        WHERE name = 'Gaming'
      ) -- Gaming Accessories should be under Gaming
      WHEN name = 'Gaming Accessories' THEN (
        SELECT id
        FROM categories
        WHERE name = 'Gaming'
      ) -- Smartphones should be under Mobile Devices
      WHEN name = 'Smartphones' THEN (
        SELECT id
        FROM categories
        WHERE name = 'Mobile Devices'
      )
      ELSE "parentId"
    END
  )
WHERE name IN (
    'Desktop PCs',
    'Tablets',
    'Consoles',
    'Gaming Accessories',
    'Smartphones'
  );
-- Show the corrected hierarchy
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
  path
FROM category_tree
ORDER BY path;
