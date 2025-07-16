-- Consolidate Electronics categories by keeping the one with most attributes
-- and migrating all references to it
-- Get the Electronics category with the most attributes (our target)
WITH target_electronics AS (
  SELECT c.id,
    COUNT(ca.id) as attr_count
  FROM categories c
    LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
  WHERE c.name = 'Electronics'
  GROUP BY c.id
  ORDER BY attr_count DESC
  LIMIT 1
), duplicate_electronics AS (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'Electronics'
    AND c.id NOT IN (
      SELECT id
      FROM target_electronics
    )
) -- First, migrate all category_attributes from duplicates to target
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  (
    SELECT id
    FROM target_electronics
  ),
  ca."attributeId",
  ca."linkType",
  ca."createdAt"
FROM category_attributes ca
WHERE ca."categoryId" IN (
    SELECT id
    FROM duplicate_electronics
  )
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes existing
    WHERE existing."categoryId" = (
        SELECT id
        FROM target_electronics
      )
      AND existing."attributeId" = ca."attributeId"
  );
-- Update child categories to point to the target Electronics
WITH target_electronics AS (
  SELECT c.id
  FROM categories c
    LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
  WHERE c.name = 'Electronics'
  GROUP BY c.id
  ORDER BY COUNT(ca.id) DESC
  LIMIT 1
), duplicate_electronics AS (
  SELECT c.id
  FROM categories c
  WHERE c.name = 'Electronics'
    AND c.id NOT IN (
      SELECT id
      FROM target_electronics
    )
)
UPDATE categories
SET "parentId" = (
    SELECT id
    FROM target_electronics
  )
WHERE "parentId" IN (
    SELECT id
    FROM duplicate_electronics
  );
-- Delete category_attributes for duplicates
DELETE FROM category_attributes
WHERE "categoryId" IN (
    SELECT c.id
    FROM categories c
      LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
    WHERE c.name = 'Electronics'
    GROUP BY c.id
    ORDER BY COUNT(ca.id) ASC
    LIMIT 3 -- Delete the 3 with fewer attributes
  );
-- Delete duplicate Electronics categories
DELETE FROM categories
WHERE id IN (
    SELECT c.id
    FROM categories c
      LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
    WHERE c.name = 'Electronics'
    GROUP BY c.id
    ORDER BY COUNT(ca.id) ASC
    LIMIT 3 -- Delete the 3 with fewer attributes
  );
-- Show final hierarchy
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
  level
FROM category_tree
ORDER BY path;
