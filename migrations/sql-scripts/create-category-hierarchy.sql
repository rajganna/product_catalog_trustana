-- Create materialized views for attribute search optimization (fixed)
-- 1. Create category hierarchy materialized view with proper type casting
CREATE MATERIALIZED VIEW mv_category_hierarchy AS WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT id as category_id,
    id as root_id,
    name,
    "parentId" as parent_id,
    ARRAY [id] as path_ids,
    name::text as category_path,
    0 as level
  FROM categories
  WHERE "parentId" IS NULL
  UNION ALL
  -- Recursive case: child categories
  SELECT c.id as category_id,
    ct.root_id,
    c.name,
    c."parentId" as parent_id,
    ct.path_ids || c.id,
    (ct.category_path || '/' || c.name)::text as category_path,
    ct.level + 1
  FROM categories c
    INNER JOIN category_tree ct ON c."parentId" = ct.category_id
  WHERE NOT c.id = ANY(ct.path_ids)
    AND ct.level < 10
)
SELECT category_id,
  root_id,
  name,
  parent_id,
  path_ids,
  category_path,
  level,
  array_length(path_ids, 1) as depth
FROM category_tree;
-- Create indexes for category hierarchy
CREATE UNIQUE INDEX idx_mv_category_hierarchy_category_id ON mv_category_hierarchy (category_id);
CREATE INDEX idx_mv_category_hierarchy_root_id ON mv_category_hierarchy (root_id);
CREATE INDEX idx_mv_category_hierarchy_level ON mv_category_hierarchy (level);
CREATE INDEX idx_mv_category_hierarchy_path_gin ON mv_category_hierarchy USING GIN (path_ids);
SELECT 'Category hierarchy materialized view created' as status;
