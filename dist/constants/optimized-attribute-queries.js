"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATERIALIZED_VIEW_UTILS = exports.OPTIMIZED_QUERY_BUILDER = exports.OPTIMIZED_QUERY_FRAGMENTS = exports.OPTIMIZED_ATTRIBUTE_QUERIES = void 0;
const LIMIT_PARAM = 'LIMIT_PARAM';
const OFFSET_PARAM = 'OFFSET_PARAM';
const KEYWORD_PARAM = 'KEYWORD_PARAM';
const LINK_TYPE_PARAM = 'LINK_TYPE_PARAM';
exports.OPTIMIZED_ATTRIBUTE_QUERIES = {
    GET_APPLICABLE_ATTRIBUTES_OPTIMIZED: `
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
      acm.link_type as "linkType",
      acm.category_id as "categoryId",
      c.name as "categoryName",
      a.relevance_score as "relevanceScore"
    FROM attributes a
    INNER JOIN mv_attribute_category_mapping acm ON a.id = acm.attribute_id
    LEFT JOIN categories c ON acm.category_id = c.id
    WHERE acm.category_id = ANY($1)
      AND a.is_active = true
      {{LINK_TYPE_FILTER}}
      {{SEARCH_CONDITION}}
    ORDER BY
      {{KEYWORD_RELEVANCE_ORDER}}
      acm.priority ASC,
      a.relevance_score DESC,
      a.name ASC
    LIMIT {{LIMIT_PARAM}} OFFSET {{OFFSET_PARAM}}
  `,
    GET_ATTRIBUTES_BY_VECTOR_SEARCH: `
    SELECT
      asv.attribute_id as id,
      asv.name,
      asv.description,
      asv.type,
      a.options,
      a.is_required as "isRequired",
      a.is_active as "isActive",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      -- Calculate dynamic relevance based on search match
      ts_rank(
        to_tsvector('english', asv.search_vector),
        plainto_tsquery('english', $2)
      ) + asv.relevance_score as "dynamicRelevance"
    FROM mv_attribute_search_vectors asv
    INNER JOIN attributes a ON asv.attribute_id = a.id
    WHERE
      EXISTS (
        SELECT 1 FROM mv_attribute_category_mapping acm
        WHERE acm.attribute_id = asv.attribute_id
        AND acm.category_id = ANY($1)
      )
      AND to_tsvector('english', asv.search_vector) @@ plainto_tsquery('english', $2)
    ORDER BY "dynamicRelevance" DESC, asv.name ASC
    LIMIT $3 OFFSET $4
  `,
    GET_CATEGORY_DESCENDANTS: `
    SELECT category_id
    FROM mv_category_hierarchy
    WHERE $1 = ANY(path_ids)
      OR category_id = $1
  `,
    GET_INHERITED_ATTRIBUTES: `
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
      acm.link_type as "linkType",
      acm.category_path as "categoryPath",
      a.relevance_score as "relevanceScore"
    FROM attributes a
    INNER JOIN mv_attribute_category_mapping acm ON a.id = acm.attribute_id
    WHERE acm.category_id = ANY($1)
      AND acm.link_type IN ('inherited', 'global')
      AND a.is_active = true
      {{SEARCH_CONDITION}}
    ORDER BY
      {{KEYWORD_RELEVANCE_ORDER}}
      acm.priority ASC,
      a.relevance_score DESC,
      a.name ASC
    LIMIT ${{ LIMIT_PARAM }} OFFSET ${{ OFFSET_PARAM }}
  `,
    COUNT_APPLICABLE_ATTRIBUTES_OPTIMIZED: `
    SELECT COUNT(DISTINCT a.id) as total
    FROM attributes a
    INNER JOIN mv_attribute_category_mapping acm ON a.id = acm.attribute_id
    WHERE acm.category_id = ANY($1)
      AND a.is_active = true
      {{LINK_TYPE_FILTER}}
      {{SEARCH_CONDITION}}
  `,
    COUNT_VECTOR_SEARCH_RESULTS: `
    SELECT COUNT(*) as total
    FROM mv_attribute_search_vectors asv
    WHERE
      EXISTS (
        SELECT 1 FROM mv_attribute_category_mapping acm
        WHERE acm.attribute_id = asv.attribute_id
        AND acm.category_id = ANY($1)
      )
      AND to_tsvector('english', asv.search_vector) @@ plainto_tsquery('english', $2)
  `,
    GET_GLOBAL_ATTRIBUTES: `
    SELECT
      a.id,
      a.name,
      a.description,
      a.type,
      a.options,
      a.is_required as "isRequired",
      a.is_active as "isActive",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      'global' as "linkType",
      a.relevance_score as "relevanceScore"
    FROM attributes a
    WHERE a.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM category_attribute ca
        WHERE ca.attribute_id = a.id
      )
      {{SEARCH_CONDITION}}
    ORDER BY
      {{KEYWORD_RELEVANCE_ORDER}}
      a.relevance_score DESC,
      a.name ASC
    LIMIT ${{ LIMIT_PARAM }} OFFSET ${{ OFFSET_PARAM }}
  `,
    GET_ATTRIBUTE_FACETS: `
    SELECT
      acm.category_id,
      c.name as category_name,
      acm.category_path,
      COUNT(DISTINCT a.id) as attribute_count,
      array_agg(DISTINCT a.name ORDER BY a.name) as attribute_names
    FROM mv_attribute_category_mapping acm
    INNER JOIN attributes a ON acm.attribute_id = a.id
    LEFT JOIN categories c ON acm.category_id = c.id
    WHERE acm.category_id = ANY($1)
      AND a.is_active = true
      {{SEARCH_CONDITION}}
    GROUP BY acm.category_id, c.name, acm.category_path
    ORDER BY attribute_count DESC, c.name ASC
  `,
    GET_ATTRIBUTE_RECOMMENDATIONS: `
    WITH target_categories AS (
      SELECT UNNEST($1::uuid[]) as category_id
    ),
    similar_categories AS (
      SELECT DISTINCT ch.category_id
      FROM mv_category_hierarchy ch
      INNER JOIN target_categories tc ON tc.category_id = ANY(ch.path_ids)
      WHERE ch.category_id != ALL($1)
    )
    SELECT DISTINCT
      a.id,
      a.name,
      a.description,
      a.type,
      a.relevance_score,
      COUNT(DISTINCT acm.category_id) as category_match_count
    FROM attributes a
    INNER JOIN mv_attribute_category_mapping acm ON a.id = acm.attribute_id
    WHERE acm.category_id IN (SELECT category_id FROM similar_categories)
      AND a.is_active = true
      AND a.id NOT IN (
        SELECT DISTINCT acm2.attribute_id
        FROM mv_attribute_category_mapping acm2
        WHERE acm2.category_id = ANY($1)
      )
    GROUP BY a.id, a.name, a.description, a.type, a.relevance_score
    ORDER BY category_match_count DESC, a.relevance_score DESC
    LIMIT $2
  `,
};
exports.OPTIMIZED_QUERY_FRAGMENTS = {
    VECTOR_SEARCH_RELEVANCE: `
    ts_rank(
      to_tsvector('english', a.search_vector),
      plainto_tsquery('english', ${{ KEYWORD_PARAM }})
    ) DESC,
  `,
    SIMPLE_RELEVANCE_ORDER: `a.relevance_score DESC,`,
    VECTOR_SEARCH_CONDITION: `
    AND to_tsvector('english', COALESCE(a.search_vector, ''))
    @@ plainto_tsquery('english', ${{ KEYWORD_PARAM }})
  `,
    SIMPLE_SEARCH_CONDITION: `
    AND (
      LOWER(a.name) LIKE ${{ KEYWORD_PARAM }}
      OR LOWER(a.description) LIKE ${{ KEYWORD_PARAM }}
    )
  `,
    LINK_TYPE_FILTER: `AND acm.link_type = ANY(${{ LINK_TYPE_PARAM }})`,
};
exports.OPTIMIZED_QUERY_BUILDER = {
    buildApplicableAttributesQuery: (useVectorSearch, hasKeyword, linkTypes, paramCount = 2) => {
        if (useVectorSearch && hasKeyword) {
            return exports.OPTIMIZED_ATTRIBUTE_QUERIES.GET_ATTRIBUTES_BY_VECTOR_SEARCH;
        }
        let query = exports.OPTIMIZED_ATTRIBUTE_QUERIES.GET_APPLICABLE_ATTRIBUTES_OPTIMIZED;
        if (linkTypes === null || linkTypes === void 0 ? void 0 : linkTypes.length) {
            query = query.replace('{{LINK_TYPE_FILTER}}', exports.OPTIMIZED_QUERY_FRAGMENTS.LINK_TYPE_FILTER.replace('{{LINK_TYPE_PARAM}}', `$${paramCount++}`));
        }
        else {
            query = query.replace('{{LINK_TYPE_FILTER}}', '');
        }
        if (hasKeyword) {
            if (useVectorSearch) {
                query = query.replace('{{SEARCH_CONDITION}}', exports.OPTIMIZED_QUERY_FRAGMENTS.VECTOR_SEARCH_CONDITION.replace('{{KEYWORD_PARAM}}', `$${paramCount++}`));
                query = query.replace('{{KEYWORD_RELEVANCE_ORDER}}', exports.OPTIMIZED_QUERY_FRAGMENTS.VECTOR_SEARCH_RELEVANCE.replace('{{KEYWORD_PARAM}}', `$${paramCount - 1}`));
            }
            else {
                query = query.replace('{{SEARCH_CONDITION}}', exports.OPTIMIZED_QUERY_FRAGMENTS.SIMPLE_SEARCH_CONDITION.replace('{{KEYWORD_PARAM}}', `$${paramCount++}`));
                query = query.replace('{{KEYWORD_RELEVANCE_ORDER}}', exports.OPTIMIZED_QUERY_FRAGMENTS.SIMPLE_RELEVANCE_ORDER);
            }
        }
        else {
            query = query.replace('{{SEARCH_CONDITION}}', '');
            query = query.replace('{{KEYWORD_RELEVANCE_ORDER}}', '');
        }
        query = query.replace('{{LIMIT_PARAM}}', `${paramCount++}`);
        query = query.replace('{{OFFSET_PARAM}}', `${paramCount}`);
        return query;
    },
    buildCountQuery: (useVectorSearch, hasKeyword, linkTypes) => {
        if (useVectorSearch && hasKeyword) {
            return exports.OPTIMIZED_ATTRIBUTE_QUERIES.COUNT_VECTOR_SEARCH_RESULTS;
        }
        let query = exports.OPTIMIZED_ATTRIBUTE_QUERIES.COUNT_APPLICABLE_ATTRIBUTES_OPTIMIZED;
        let paramCount = 2;
        if (linkTypes === null || linkTypes === void 0 ? void 0 : linkTypes.length) {
            query = query.replace('{{LINK_TYPE_FILTER}}', exports.OPTIMIZED_QUERY_FRAGMENTS.LINK_TYPE_FILTER.replace('{{LINK_TYPE_PARAM}}', `$${paramCount++}`));
        }
        else {
            query = query.replace('{{LINK_TYPE_FILTER}}', '');
        }
        if (hasKeyword) {
            if (useVectorSearch) {
                query = query.replace('{{SEARCH_CONDITION}}', exports.OPTIMIZED_QUERY_FRAGMENTS.VECTOR_SEARCH_CONDITION.replace('{{KEYWORD_PARAM}}', `$${paramCount}`));
            }
            else {
                query = query.replace('{{SEARCH_CONDITION}}', exports.OPTIMIZED_QUERY_FRAGMENTS.SIMPLE_SEARCH_CONDITION.replace('{{KEYWORD_PARAM}}', `$${paramCount}`));
            }
        }
        else {
            query = query.replace('{{SEARCH_CONDITION}}', '');
        }
        return query;
    },
};
exports.MATERIALIZED_VIEW_UTILS = {
    REFRESH_ALL_VIEWS: `
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_hierarchy;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attribute_category_mapping;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attribute_search_vectors;
  `,
    GET_VIEW_REFRESH_STATUS: `
    SELECT
      schemaname,
      matviewname,
      hasindexes,
      ispopulated,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
    FROM pg_matviews
    WHERE matviewname IN (
      'mv_category_hierarchy',
      'mv_attribute_category_mapping',
      'mv_attribute_search_vectors'
    )
  `,
    CHECK_VIEW_STALENESS: `
    SELECT
      'mv_category_hierarchy' as view_name,
      MAX(updated_at) as last_category_update,
      (SELECT last_refresh FROM pg_stat_user_tables WHERE relname = 'mv_category_hierarchy') as last_refresh
    FROM categories
    UNION ALL
    SELECT
      'mv_attribute_category_mapping' as view_name,
      GREATEST(
        MAX(a.updated_at),
        (SELECT MAX(updated_at) FROM categories)
      ) as last_category_update,
      (SELECT last_refresh FROM pg_stat_user_tables WHERE relname = 'mv_attribute_category_mapping') as last_refresh
    FROM attributes a
    UNION ALL
    SELECT
      'mv_attribute_search_vectors' as view_name,
      MAX(updated_at) as last_category_update,
      (SELECT last_refresh FROM pg_stat_user_tables WHERE relname = 'mv_attribute_search_vectors') as last_refresh
    FROM attributes
  `,
};
//# sourceMappingURL=optimized-attribute-queries.js.map