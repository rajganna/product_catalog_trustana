-- Create attribute search vectors
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
SELECT 'Attribute search vectors materialized view created' as status;
