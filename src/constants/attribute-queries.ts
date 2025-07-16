export const ATTRIBUTE_QUERIES = {
  /**
   * Get applicable attributes with advanced PostgreSQL features
   * Supports direct, inherited, and global attributes with full-text search
   */
  GET_APPLICABLE_ATTRIBUTES: `
    WITH RECURSIVE category_hierarchy AS (
      -- Get all categories and their ancestors
      SELECT id, parent_id, ARRAY[id] as path, 0 as level
      FROM category
      WHERE id = ANY($1)

      UNION ALL

      SELECT c.id, c.parent_id, ch.path || c.id, ch.level + 1
      FROM category c
      INNER JOIN category_hierarchy ch ON c.id = ch.parent_id
      WHERE NOT c.id = ANY(ch.path) AND ch.level < 10
    ),
    attribute_links AS (
      -- Direct attributes
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a.is_required as "isRequired",
        a.is_active as "isActive",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        '{{DIRECT_LINK_TYPE}}' as "linkType",
        ca.category_id as "categoryId",
        c.name as "categoryName",
        {{RELEVANCE_SCORE_DIRECT}}
        1 as link_priority
      FROM attribute a
      INNER JOIN category_attribute ca ON a.id = ca.attribute_id
      INNER JOIN category c ON ca.category_id = c.id
      WHERE ca.category_id = ANY($1)
        AND a.is_active = true
        AND ('{{DIRECT_LINK_TYPE}}' = ANY(ARRAY[{{LINK_TYPE_CONDITIONS}}]))
        {{SEARCH_CONDITION}}

      UNION ALL

      -- Inherited attributes (using recursive CTE)
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a.is_required as "isRequired",
        a.is_active as "isActive",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        '{{INHERITED_LINK_TYPE}}' as "linkType",
        ca.category_id as "categoryId",
        c.name as "categoryName",
        {{RELEVANCE_SCORE_INHERITED}}
        2 as link_priority
      FROM attribute a
      INNER JOIN category_attribute ca ON a.id = ca.attribute_id
      INNER JOIN category c ON ca.category_id = c.id
      INNER JOIN category_hierarchy ch ON ca.category_id = ch.id
      WHERE ca.category_id != ANY($1) -- Exclude direct links
        AND a.is_active = true
        AND ('{{INHERITED_LINK_TYPE}}' = ANY(ARRAY[{{LINK_TYPE_CONDITIONS}}]))
        {{SEARCH_CONDITION}}

      UNION ALL

      -- Global attributes
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a.is_required as "isRequired",
        a.is_active as "isActive",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        '{{GLOBAL_LINK_TYPE}}' as "linkType",
        NULL as "categoryId",
        NULL as "categoryName",
        {{RELEVANCE_SCORE_GLOBAL}}
        3 as link_priority
      FROM attribute a
      WHERE a.is_active = true
        AND NOT EXISTS (SELECT 1 FROM category_attribute ca WHERE ca.attribute_id = a.id)
        AND ('{{GLOBAL_LINK_TYPE}}' = ANY(ARRAY[{{LINK_TYPE_CONDITIONS}}]))
        {{SEARCH_CONDITION}}
    ),
    ranked_attributes AS (
      SELECT
        *,
        -- Use PostgreSQL's window functions for intelligent ranking
        ROW_NUMBER() OVER (
          PARTITION BY id
          ORDER BY link_priority, relevance_score DESC, name
        ) as rn
      FROM attribute_links
    ),
    final_results AS (
      SELECT
        id,
        name,
        description,
        type,
        options,
        "isRequired",
        "isActive",
        "createdAt",
        "updatedAt",
        "linkType",
        "categoryId",
        "categoryName"
      FROM ranked_attributes
      WHERE rn = 1
    )
    SELECT *
    FROM final_results
    ORDER BY
      {{KEYWORD_ORDER}}
      {{SORT_CONDITIONS}}
      name -- fallback ordering
    LIMIT {{LIMIT_PARAM}} OFFSET {{OFFSET_PARAM}}
  `,

  /**
   * Count applicable attributes for pagination
   */
  COUNT_DIRECT_ATTRIBUTES: `
    SELECT DISTINCT a.id
    FROM attribute a
    INNER JOIN category_attribute ca ON a.id = ca.attribute_id
    WHERE ca.category_id = ANY($1)
      AND a.is_active = true
      {{KEYWORD_CONDITION}}
  `,

  COUNT_INHERITED_ATTRIBUTES: `
    WITH RECURSIVE parent_categories AS (
      SELECT parent_id as category_id, 1 as level
      FROM category
      WHERE id = ANY($1) AND parent_id IS NOT NULL

      UNION ALL

      SELECT c.parent_id, pc.level + 1
      FROM category c
      INNER JOIN parent_categories pc ON c.id = pc.category_id
      WHERE c.parent_id IS NOT NULL AND pc.level < 10
    )
    SELECT DISTINCT a.id
    FROM attribute a
    INNER JOIN category_attribute ca ON a.id = ca.attribute_id
    INNER JOIN parent_categories pc ON ca.category_id = pc.category_id
    WHERE a.is_active = true
      {{KEYWORD_CONDITION}}
  `,

  COUNT_GLOBAL_ATTRIBUTES: `
    SELECT DISTINCT a.id
    FROM attribute a
    WHERE a.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM category_attribute ca WHERE ca.attribute_id = a.id
      )
      {{KEYWORD_CONDITION}}
  `,

  /**
   * Get not applicable attributes (attributes not linked to specified categories)
   */
  GET_NOT_APPLICABLE_ATTRIBUTES: `
    SELECT
      a.id,
      a.name,
      a.description,
      a.type,
      a.options,
      a.is_required as "isRequired",
      a.is_active as "isActive",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt"
    FROM attribute a
    WHERE a.is_active = true
      {{KEYWORD_CONDITION}}
      AND a.id NOT IN (
        SELECT DISTINCT ca.attribute_id
        FROM category_attribute ca
        WHERE ca.category_id = ANY($1)
      )
    ORDER BY a.{{SORT_BY}} {{SORT_ORDER}}
    LIMIT {{LIMIT_PARAM}} OFFSET {{OFFSET_PARAM}}
  `,

  /**
   * Count not applicable attributes
   */
  COUNT_NOT_APPLICABLE_ATTRIBUTES: `
    SELECT COUNT(*) as total
    FROM attribute a
    WHERE a.is_active = true
      {{KEYWORD_CONDITION}}
      AND a.id NOT IN (
        SELECT DISTINCT ca.attribute_id
        FROM category_attribute ca
        WHERE ca.category_id = ANY($1)
      )
  `,

  /**
   * Combined count query for all applicable attributes
   */
  COUNT_APPLICABLE_ATTRIBUTES: `
    WITH combined_attributes AS (
      {{UNION_QUERIES}}
    )
    SELECT COUNT(*) as total
    FROM combined_attributes
  `,

  /**
   * Simplified queries for attribute service refactoring
   */
  SIMPLE_QUERIES: {
    /**
     * Get attributes linked to specific categories with link type filtering
     */
    GET_LINKED_ATTRIBUTES: `
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a."isRequired",
        a."isActive",
        a."createdAt",
        a."updatedAt"
      FROM attributes a
      INNER JOIN category_attributes ca ON a.id = ca."attributeId"
      WHERE a."isActive" = true
        AND ca."categoryId" = ANY($1)
        AND ca."linkType" = ANY($2)
      ORDER BY a.name
    `,

    /**
     * Get global attributes (not linked to any category)
     */
    GET_GLOBAL_ATTRIBUTES: `
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a."isRequired",
        a."isActive",
        a."createdAt",
        a."updatedAt"
      FROM attributes a
      LEFT JOIN category_attributes ca ON a.id = ca."attributeId"
      WHERE a."isActive" = true
        AND ca.id IS NULL
      ORDER BY a.name
    `,

    /**
     * Get attributes not applicable to specific categories
     */
    GET_NOT_APPLICABLE_ATTRIBUTES: `
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a."isRequired",
        a."isActive",
        a."createdAt",
        a."updatedAt"
      FROM attributes a
      LEFT JOIN category_attributes ca ON a.id = ca."attributeId"
        AND ca."categoryId" = ANY($1)
      WHERE a."isActive" = true
        AND ca.id IS NULL
      ORDER BY a.name
    `,

    /**
     * Get category hierarchy (ancestors) for a given category
     */
    GET_CATEGORY_ANCESTORS: `
      WITH RECURSIVE category_ancestors AS (
        SELECT id, "parentId", 0 as level
        FROM categories
        WHERE id = $1

        UNION ALL

        SELECT c.id, c."parentId", ca.level + 1
        FROM categories c
        INNER JOIN category_ancestors ca ON c.id = ca."parentId"
        WHERE ca.level < 10
      )
      SELECT id
      FROM category_ancestors
      WHERE level > 0
    `,

    /**
     * Count linked attributes for specific categories and link types
     */
    COUNT_LINKED_ATTRIBUTES: `
      SELECT COUNT(DISTINCT a.id) as count
      FROM attributes a
      INNER JOIN category_attributes ca ON a.id = ca."attributeId"
      WHERE a."isActive" = true
        AND ca."categoryId" = ANY($1)
        AND ca."linkType" = ANY($2)
    `,

    /**
     * Count global attributes
     */
    COUNT_GLOBAL_ATTRIBUTES: `
      SELECT COUNT(DISTINCT a.id) as count
      FROM attributes a
      LEFT JOIN category_attributes ca ON a.id = ca."attributeId"
      WHERE a."isActive" = true
        AND ca.id IS NULL
    `,

    /**
     * Count not applicable attributes
     */
    COUNT_NOT_APPLICABLE_ATTRIBUTES: `
      SELECT COUNT(DISTINCT a.id) as count
      FROM attributes a
      LEFT JOIN category_attributes ca ON a.id = ca."attributeId"
        AND ca."categoryId" = ANY($1)
      WHERE a."isActive" = true
        AND ca.id IS NULL
    `,
  },
};

export const QUERY_FRAGMENTS = {
  /**
   * Full-text search condition with PostgreSQL's tsvector
   */
  SEARCH_CONDITION_WITH_FTS: `AND (
    to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))
    @@ plainto_tsquery('english', $2)
    OR LOWER(a.name) LIKE $3
    OR LOWER(a.description) LIKE $3
  )`,

  /**
   * Simple LIKE search condition
   */
  SEARCH_CONDITION_SIMPLE: `AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)`,

  /**
   * Relevance scoring using PostgreSQL's ts_rank
   */
  RELEVANCE_SCORE_WITH_FTS: `ts_rank(
    to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '')),
    plainto_tsquery('english', $2)
  ) as relevance_score,`,

  /**
   * Default relevance score when no search keyword
   */
  RELEVANCE_SCORE_DEFAULT: '0 as relevance_score,',

  /**
   * Keyword-based ordering
   */
  KEYWORD_ORDER: 'relevance_score DESC,',

  /**
   * Sort condition templates
   */
  SORT_CASE_NAME: 'CASE WHEN ${{SORT_PARAM}} = \'name\' THEN name END {{SORT_ORDER}},',
  SORT_CASE_CREATED: 'CASE WHEN ${{SORT_PARAM}} = \'createdAt\' THEN "createdAt" END {{SORT_ORDER}},',
  SORT_CASE_UPDATED: 'CASE WHEN ${{SORT_PARAM}} = \'updatedAt\' THEN "updatedAt" END {{SORT_ORDER}},',
};

export const QUERY_REPLACEMENTS = {
  /**
   * Replace template placeholders in queries
   */
  buildApplicableAttributesQuery: (
    linkTypes: string[],
    hasKeyword: boolean,
    sortBy: string,
    sortOrder: string,
    paramCount: number
  ): string => {
    let query = ATTRIBUTE_QUERIES.GET_APPLICABLE_ATTRIBUTES;

    // Replace link type placeholders
    query = query.replace(/\{\{DIRECT_LINK_TYPE\}\}/g, 'direct');
    query = query.replace(/\{\{INHERITED_LINK_TYPE\}\}/g, 'inherited');
    query = query.replace(/\{\{GLOBAL_LINK_TYPE\}\}/g, 'global');
    query = query.replace(/\{\{LINK_TYPE_CONDITIONS\}\}/g, linkTypes.map(type => `'${type}'`).join(','));

    // Replace search conditions
    const searchCondition = hasKeyword ? QUERY_FRAGMENTS.SEARCH_CONDITION_WITH_FTS : '';
    query = query.replace(/\{\{SEARCH_CONDITION\}\}/g, searchCondition);

    // Replace relevance scores
    const relevanceScore = hasKeyword ? QUERY_FRAGMENTS.RELEVANCE_SCORE_WITH_FTS : QUERY_FRAGMENTS.RELEVANCE_SCORE_DEFAULT;
    query = query.replace(/\{\{RELEVANCE_SCORE_DIRECT\}\}/g, relevanceScore);
    query = query.replace(/\{\{RELEVANCE_SCORE_INHERITED\}\}/g, relevanceScore);
    query = query.replace(/\{\{RELEVANCE_SCORE_GLOBAL\}\}/g, relevanceScore);

    // Replace ordering
    const keywordOrder = hasKeyword ? QUERY_FRAGMENTS.KEYWORD_ORDER : '';
    query = query.replace(/\{\{KEYWORD_ORDER\}\}/g, keywordOrder);

    // Replace sort conditions
    const sortConditions = [
      QUERY_FRAGMENTS.SORT_CASE_NAME,
      QUERY_FRAGMENTS.SORT_CASE_CREATED,
      QUERY_FRAGMENTS.SORT_CASE_UPDATED,
    ].map(condition =>
      condition
        .replace(/\{\{SORT_PARAM\}\}/g, `${paramCount - 2}`)
        .replace(/\{\{SORT_ORDER\}\}/g, sortOrder)
    ).join('\n        ');

    query = query.replace(/\{\{SORT_CONDITIONS\}\}/g, sortConditions);

    // Replace limit and offset parameters
    query = query.replace(/\{\{LIMIT_PARAM\}\}/g, `$${paramCount - 1}`);
    query = query.replace(/\{\{OFFSET_PARAM\}\}/g, `$${paramCount}`);

    return query;
  },

  /**
   * Build not applicable attributes query
   */
  buildNotApplicableAttributesQuery: (
    hasKeyword: boolean,
    sortBy: string,
    sortOrder: string
  ): string => {
    let query = ATTRIBUTE_QUERIES.GET_NOT_APPLICABLE_ATTRIBUTES;

    const keywordCondition = hasKeyword ? QUERY_FRAGMENTS.SEARCH_CONDITION_SIMPLE : '';
    query = query.replace(/\{\{KEYWORD_CONDITION\}\}/g, keywordCondition);
    query = query.replace(/\{\{SORT_BY\}\}/g, sortBy);
    query = query.replace(/\{\{SORT_ORDER\}\}/g, sortOrder);

    const limitParam = hasKeyword ? '$3' : '$2';
    const offsetParam = hasKeyword ? '$4' : '$3';
    query = query.replace(/\{\{LIMIT_PARAM\}\}/g, limitParam);
    query = query.replace(/\{\{OFFSET_PARAM\}\}/g, offsetParam);

    return query;
  },

  /**
   * Build count queries
   */
  buildCountQuery: (
    queryTemplate: string,
    hasKeyword: boolean
  ): string => {
    const keywordCondition = hasKeyword ? QUERY_FRAGMENTS.SEARCH_CONDITION_SIMPLE : '';
    return queryTemplate.replace(/\{\{KEYWORD_CONDITION\}\}/g, keywordCondition);
  },
};
