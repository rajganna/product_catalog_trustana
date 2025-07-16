-- Create materialized views for attribute search optimization
-- Based on our actual table structure
-- 1. Create category hierarchy materialized view
CREATE MATERIALIZED VIEW mv_category_hierarchy AS WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT id as category_id,
    id as root_id,
    name,
    "parentId" as parent_id,
    ARRAY [id] as path_ids,
    name as category_path,
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
    ct.category_path || '/' || c.name as category_path,
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
-- 2. Create attribute-category mapping with inheritance
CREATE MATERIALIZED VIEW mv_attribute_category_mapping AS WITH attribute_inheritance AS (
  -- Direct attribute assignments
  SELECT DISTINCT a.id as attribute_id,
    a.name as attribute_name,
    ca."categoryId" as category_id,
    ch.category_path,
    ch.level,
    ca."linkType" as link_type,
    CASE
      WHEN ca."linkType" = 'direct' THEN 1
      WHEN ca."linkType" = 'inherited' THEN 2
      WHEN ca."linkType" = 'global' THEN 3
      ELSE 4
    END as priority
  FROM attributes a
    INNER JOIN category_attributes ca ON a.id = ca."attributeId"
    INNER JOIN mv_category_hierarchy ch ON ca."categoryId" = ch.category_id
  WHERE a."isActive" = true
)
SELECT attribute_id,
  attribute_name,
  category_id,
  category_path,
  level,
  link_type,
  priority,
  -- Create searchable text for this mapping
  attribute_name || ' ' || category_path as search_text
FROM attribute_inheritance;
-- Create indexes for attribute-category mapping
CREATE INDEX idx_mv_attr_cat_mapping_attr_id ON mv_attribute_category_mapping (attribute_id);
CREATE INDEX idx_mv_attr_cat_mapping_cat_id ON mv_attribute_category_mapping (category_id);
CREATE INDEX idx_mv_attr_cat_mapping_link_type ON mv_attribute_category_mapping (link_type);
CREATE INDEX idx_mv_attr_cat_mapping_priority ON mv_attribute_category_mapping (priority);
-- Create GIN index for full-text search on search_text
CREATE INDEX idx_mv_attr_cat_mapping_search_fts ON mv_attribute_category_mapping USING GIN (to_tsvector('english', search_text));
-- 3. Create attribute search vectors
CREATE MATERIALIZED VIEW mv_attribute_search_vectors AS
SELECT a.id as attribute_id,
  a.name,
  a.description,
  a.type,
  -- Create comprehensive search vector
  COALESCE(a.name, '') || ' ' || COALESCE(a.description, '') || ' ' || COALESCE(a.type::text, '') || ' ' || COALESCE(
    string_agg(DISTINCT acm.category_path, ' '),
    ''
  ) as search_vector,
  -- Calculate relevance score
  CASE
    WHEN a."isActive" THEN 10
    ELSE 0
  END + CASE
    WHEN a.name IS NOT NULL THEN 5
    ELSE 0
  END + CASE
    WHEN a.description IS NOT NULL THEN 3
    ELSE 0
  END + CASE
    WHEN a."isRequired" THEN 2
    ELSE 0
  END + LEAST(COUNT(DISTINCT acm.category_id) * 2, 10) as relevance_score
FROM attributes a
  LEFT JOIN mv_attribute_category_mapping acm ON a.id = acm.attribute_id
WHERE a."isActive" = true
GROUP BY a.id,
  a.name,
  a.description,
  a.type,
  a."isActive",
  a."isRequired";
-- Create indexes for search vectors view
CREATE UNIQUE INDEX idx_mv_attr_search_vectors_attr_id ON mv_attribute_search_vectors (attribute_id);
CREATE INDEX idx_mv_attr_search_vectors_relevance ON mv_attribute_search_vectors (relevance_score DESC);
CREATE INDEX idx_mv_attr_search_vectors_fts ON mv_attribute_search_vectors USING GIN (to_tsvector('english', search_vector));
-- Add indexes to attributes table for the new columns
CREATE INDEX IF NOT EXISTS idx_attributes_search_vector_fts ON attributes USING GIN (
  to_tsvector('english', COALESCE("searchVector", ''))
);
CREATE INDEX IF NOT EXISTS idx_attributes_category_paths ON attributes ("categoryPaths");
CREATE INDEX IF NOT EXISTS idx_attributes_relevance_score ON attributes ("relevanceScore" DESC);
SELECT 'Materialized views and indexes created successfully' as status;
