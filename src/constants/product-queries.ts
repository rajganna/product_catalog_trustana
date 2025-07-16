export const PRODUCT_QUERIES = {
  /**
   * Base product search query with joins
   */
  BASE_SEARCH_QUERY: `
    SELECT
      p.id,
      p.name,
      p.description,
      p.price,
      p."categoryId",
      p."isActive",
      p."createdAt",
      p."updatedAt",
      p."searchVector",
      p."searchScore",
      p."categoryPath",
      p."attributeIndex",
      c.id as "category_id",
      c.name as "category_name",
      c.description as "category_description"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
  `,

  /**
   * Search products with full-text search and filters
   */
  SEARCH_PRODUCTS: `
    SELECT
      p.*,
      c.name as "categoryName"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
  `,

  /**
   * Get product by ID with all relations
   */
  GET_PRODUCT_BY_ID: `
    SELECT
      p.*,
      c.name as "categoryName",
      c.description as "categoryDescription"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN product_attribute_values pav ON p.id = pav."productId"
    WHERE p.id = $1
  `,

  /**
   * Get products by category
   */
  GET_PRODUCTS_BY_CATEGORY: `
    SELECT
      p.*,
      c.name as "categoryName"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."categoryId" = $1
      AND p."isActive" = true
    ORDER BY p.name
  `,

  /**
   * Get product recommendations based on category and price range
   */
  GET_RECOMMENDATIONS: `
    SELECT
      p.*,
      c.name as "categoryName"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."categoryId" = $1
      AND p.id != $2
      AND p.price BETWEEN $3 AND $4
      AND p."isActive" = true
    ORDER BY RANDOM()
    LIMIT $5
  `,

  /**
   * Search products with keyword using full-text search
   */
  KEYWORD_SEARCH: `
    SELECT
      p.*,
      c.name as "categoryName",
      ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')), plainto_tsquery('english', $1)) as relevance
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
      AND (
        to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', $1)
        OR p."searchVector" ILIKE $2
      )
    ORDER BY relevance DESC, p.name
  `,

  /**
   * Count products matching search criteria
   */
  COUNT_SEARCH_RESULTS: `
    SELECT COUNT(*) as total
    FROM products p
    WHERE p."isActive" = true
  `,

  /**
   * Filter conditions for different search criteria
   */
  FILTERS: {
    KEYWORD: `(p."searchVector" ILIKE :keyword)`,
    CATEGORY: `(p."categoryPath" LIKE ANY(:categoryPaths))`,
    PRICE_RANGE: `(p.price BETWEEN :priceMin AND :priceMax)`,
    MIN_PRICE: `(p.price >= :priceMin)`,
    MAX_PRICE: `(p.price <= :priceMax)`,
    ATTRIBUTE: `(p."attributeIndex"::jsonb ? :attrKey AND p."attributeIndex"::jsonb ->> :attrKey ~ :attrPattern)`,
  },

  /**
   * Sorting options
   */
  SORTING: {
    RELEVANCE: `p."searchScore" DESC, p.name`,
    RELEVANCE_WITH_KEYWORD: `p."searchScore" DESC`,
    NAME_ASC: `p.name ASC`,
    NAME_DESC: `p.name DESC`,
    PRICE_ASC: `p.price ASC`,
    PRICE_DESC: `p.price DESC`,
    CREATED_ASC: `p."createdAt" ASC`,
    CREATED_DESC: `p."createdAt" DESC`,
  },
}
