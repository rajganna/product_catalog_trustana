export const CATEGORY_QUERIES = {
  /**
   * Build category tree with optional attribute and product counts
   * Supports up to 3 levels of nesting with recursive CTE
   */
  BUILD_CATEGORY_TREE: (
    includeAttributeCount: boolean,
    includeProductCount: boolean,
  ): string => {
    const attributeCountFields = includeAttributeCount
      ? `, COALESCE(ac.attribute_count, 0) as "directAttributeCount"`
      : ''

    const productCountFields = includeProductCount
      ? `, COALESCE(pc.product_count, 0) as "productCount"`
      : ''

    const attributeCountJoin = includeAttributeCount
      ? `
      LEFT JOIN (
        SELECT
          ca."categoryId",
          COUNT(*) as attribute_count
        FROM category_attributes ca
        INNER JOIN attributes a ON ca."attributeId" = a.id
        WHERE a."isActive" = true
        GROUP BY ca."categoryId"
      ) ac ON ct.id = ac."categoryId"`
      : ''

    const productCountJoin = includeProductCount
      ? `
      LEFT JOIN (
        SELECT
          p."categoryId",
          COUNT(*) as product_count
        FROM products p
        WHERE p."isActive" = true
        GROUP BY p."categoryId"
      ) pc ON ct.id = pc."categoryId"`
      : ''

    const attributeCountInJson = includeAttributeCount
      ? `, 'directAttributeCount', root."directAttributeCount"`
      : ''

    const productCountInJson = includeProductCount
      ? `, 'productCount', root."productCount"`
      : ''

    const childAttributeCountInJson = includeAttributeCount
      ? `, 'directAttributeCount', child."directAttributeCount"`
      : ''

    const childProductCountInJson = includeProductCount
      ? `, 'productCount', child."productCount"`
      : ''

    const grandchildAttributeCountInJson = includeAttributeCount
      ? `, 'directAttributeCount', grandchild."directAttributeCount"`
      : ''

    const grandchildProductCountInJson = includeProductCount
      ? `, 'productCount', grandchild."productCount"`
      : ''

    return `
      WITH RECURSIVE category_tree AS (
        SELECT
          c.id,
          c.name,
          c.description,
          c."parentId" as "parentId",
          c."createdAt" as "createdAt",
          c."updatedAt" as "updatedAt",
          0 as level,
          ARRAY[c.id] as path
        FROM categories c
        WHERE c."parentId" IS NULL

        UNION ALL

        SELECT
          c.id,
          c.name,
          c.description,
          c."parentId" as "parentId",
          c."createdAt" as "createdAt",
          c."updatedAt" as "updatedAt",
          ct.level + 1,
          ct.path || c.id
        FROM categories c
        INNER JOIN category_tree ct ON c."parentId" = ct.id
        WHERE NOT c.id = ANY(ct.path) AND ct.level < 10
      ),
      enriched_categories AS (
        SELECT
          ct.*${attributeCountFields}${productCountFields}
        FROM category_tree ct
        ${attributeCountJoin}
        ${productCountJoin}
      )
      SELECT
        JSON_BUILD_OBJECT(
          'id', root.id,
          'name', root.name,
          'description', root.description,
          'parentId', root."parentId",
          'createdAt', root."createdAt",
          'updatedAt', root."updatedAt"${attributeCountInJson}${productCountInJson},
          'children', COALESCE(
            (
              WITH children_tree AS (
                SELECT
                  JSON_BUILD_OBJECT(
                    'id', child.id,
                    'name', child.name,
                    'description', child.description,
                    'parentId', child."parentId",
                    'createdAt', child."createdAt",
                    'updatedAt', child."updatedAt"${childAttributeCountInJson}${childProductCountInJson},
                    'children', COALESCE(
                      (
                        SELECT JSON_AGG(
                          JSON_BUILD_OBJECT(
                            'id', grandchild.id,
                            'name', grandchild.name,
                            'description', grandchild.description,
                            'parentId', grandchild."parentId",
                            'createdAt', grandchild."createdAt",
                            'updatedAt', grandchild."updatedAt"${grandchildAttributeCountInJson}${grandchildProductCountInJson},
                            'children', '[]'::json
                          ) ORDER BY grandchild.name
                        )
                        FROM enriched_categories grandchild
                        WHERE grandchild."parentId" = child.id
                      ),
                      '[]'::json
                    )
                  ) as child_json
                FROM enriched_categories child
                WHERE child."parentId" = root.id
                ORDER BY child.name
              )
              SELECT JSON_AGG(child_json)
              FROM children_tree
            ),
            '[]'::json
          )
        ) as category_json
      FROM enriched_categories root
      WHERE root."parentId" IS NULL
      ORDER BY root.name
    `
  },
}
