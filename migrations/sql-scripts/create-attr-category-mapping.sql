-- Create attribute-category mapping with inheritance
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
SELECT 'Attribute-category mapping materialized view created' as status;
