-- Setup comprehensive test data with 10+ products, categories, and attributes with inheritance
-- This script demonstrates the full inheritance system in action
-- First, clean up existing test data to start fresh
DELETE FROM product_attribute_values;
DELETE FROM products;
DELETE FROM category_attributes
WHERE "linkType" != 'direct'
  OR "categoryId" NOT IN (
    SELECT id
    FROM categories
    WHERE name IN ('Electronics', 'Global')
  );
-- Keep our inheritance structure but clean products
-- 1. Set up a comprehensive category hierarchy
-- Add more categories to demonstrate deeper inheritance
INSERT INTO categories (id, name, description, "parentId")
VALUES -- Computing subcategories under Electronics
  (
    gen_random_uuid(),
    'Computing',
    'Computing devices and accessories',
    (
      SELECT id
      FROM categories
      WHERE name = 'Electronics'
      LIMIT 1
    )
  ), (
    gen_random_uuid(), 'Mobile Devices', 'Mobile phones and tablets', (
      SELECT id
      FROM categories
      WHERE name = 'Electronics'
      LIMIT 1
    )
  ), (
    gen_random_uuid(), 'Gaming', 'Gaming consoles and accessories', (
      SELECT id
      FROM categories
      WHERE name = 'Electronics'
      LIMIT 1
    )
  ), -- Third level categories (deeper inheritance)
  (
    gen_random_uuid(), 'Desktop PCs', 'Desktop computers and workstations', (
      SELECT id
      FROM categories
      WHERE name = 'Computing'
    )
  ),
  (
    gen_random_uuid(),
    'Tablets',
    'Tablet computers and e-readers',
    (
      SELECT id
      FROM categories
      WHERE name = 'Mobile Devices'
    )
  ),
  (
    gen_random_uuid(),
    'Consoles',
    'Gaming consoles',
    (
      SELECT id
      FROM categories
      WHERE name = 'Gaming'
    )
  ),
  (
    gen_random_uuid(),
    'Gaming Accessories',
    'Controllers, headsets, etc.',
    (
      SELECT id
      FROM categories
      WHERE name = 'Gaming'
    )
  ) ON CONFLICT DO NOTHING;
-- 2. Add more comprehensive attributes
INSERT INTO attributes (
    id,
    name,
    description,
    type,
    "isRequired",
    "isActive"
  )
VALUES -- Electronics-level attributes (will be inherited by all)
  (
    gen_random_uuid(),
    'Manufacturer',
    'Product manufacturer/brand',
    'text',
    true,
    true
  ),
  (
    gen_random_uuid(),
    'Model Number',
    'Manufacturer model number',
    'text',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Release Date',
    'Product release date',
    'date',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Energy Rating',
    'Energy efficiency rating',
    'select',
    false,
    true
  ),
  -- Computing-specific attributes
  (
    gen_random_uuid(),
    'Processor',
    'CPU/processor type',
    'text',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'RAM',
    'Memory in GB',
    'number',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Storage',
    'Storage capacity',
    'text',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Operating System',
    'Pre-installed OS',
    'text',
    false,
    true
  ),
  -- Mobile-specific attributes
  (
    gen_random_uuid(),
    'Screen Size',
    'Display size in inches',
    'number',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Battery Life',
    'Battery life in hours',
    'number',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Camera Resolution',
    'Main camera megapixels',
    'number',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Network Type',
    '4G/5G connectivity',
    'select',
    false,
    true
  ),
  -- Gaming-specific attributes
  (
    gen_random_uuid(),
    'Platform',
    'Gaming platform/console',
    'text',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Max Resolution',
    'Maximum video resolution',
    'text',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Controller Type',
    'Type of controller',
    'text',
    false,
    true
  ),
  -- Additional global attributes
  (
    gen_random_uuid(),
    'Connectivity',
    'Connection options',
    'multi_select',
    false,
    true
  ),
  (
    gen_random_uuid(),
    'Dimensions',
    'Physical dimensions',
    'text',
    false,
    true
  ) ON CONFLICT DO NOTHING;
-- 3. Set up direct attribute assignments to parent categories
-- Electronics gets core attributes
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'direct',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Electronics'
  AND a.name IN (
    'Manufacturer',
    'Model Number',
    'Release Date',
    'Energy Rating'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- Computing gets computing-specific attributes
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'direct',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Computing'
  AND a.name IN (
    'Processor',
    'RAM',
    'Storage',
    'Operating System'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- Mobile Devices gets mobile-specific attributes
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'direct',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Mobile Devices'
  AND a.name IN (
    'Screen Size',
    'Battery Life',
    'Camera Resolution',
    'Network Type'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- Gaming gets gaming-specific attributes
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'direct',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Gaming'
  AND a.name IN ('Platform', 'Max Resolution', 'Controller Type')
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- Add more global attributes
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  )
SELECT gen_random_uuid(),
  c.id,
  a.id,
  'global',
  NOW()
FROM categories c
  CROSS JOIN attributes a
WHERE c.name = 'Global'
  AND a.name IN ('Connectivity', 'Dimensions')
  AND NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = c.id
      AND ca."attributeId" = a.id
  );
-- 4. Create inherited links for all child categories
-- This will create inheritance from parent to child categories
INSERT INTO category_attributes (
    id,
    "categoryId",
    "attributeId",
    "linkType",
    "createdAt"
  ) WITH RECURSIVE category_tree AS (
    -- Get all parent categories with their direct attributes
    SELECT c.id as parent_id,
      c.name as parent_name,
      ca."attributeId" as attribute_id,
      a.name as attribute_name
    FROM categories c
      JOIN category_attributes ca ON c.id = ca."categoryId"
      AND ca."linkType" = 'direct'
      JOIN attributes a ON ca."attributeId" = a.id
  ),
  child_categories AS (
    -- Get all child categories
    SELECT child.id as child_id,
      child.name as child_name,
      parent.id as parent_id
    FROM categories child
      JOIN categories parent ON child."parentId" = parent.id
  )
SELECT gen_random_uuid(),
  cc.child_id,
  ct.attribute_id,
  'inherited',
  NOW()
FROM child_categories cc
  JOIN category_tree ct ON cc.parent_id = ct.parent_id
WHERE NOT EXISTS (
    SELECT 1
    FROM category_attributes ca
    WHERE ca."categoryId" = cc.child_id
      AND ca."attributeId" = ct.attribute_id
  );
-- 5. Create 15+ realistic products across different categories
INSERT INTO products (
    id,
    name,
    description,
    sku,
    price,
    "categoryId",
    "isActive"
  )
VALUES -- Laptops (inherit from Computing -> Electronics)
  (
    gen_random_uuid(),
    'MacBook Pro 16-inch',
    'High-performance laptop for professionals',
    'MBP-16-2023',
    2499.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Laptops'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Dell XPS 13',
    'Ultrabook with premium build quality',
    'XPS-13-9320',
    1299.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Laptops'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'ThinkPad X1 Carbon',
    'Business laptop with excellent keyboard',
    'TP-X1C-G10',
    1599.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Laptops'
    ),
    true
  ),
  -- Desktop PCs (inherit from Computing -> Electronics)
  (
    gen_random_uuid(),
    'iMac 24-inch',
    'All-in-one desktop computer',
    'IMAC-24-M2',
    1499.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Desktop PCs'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Gaming PC RTX 4080',
    'High-end gaming desktop',
    'PC-RTX4080-32GB',
    2999.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Desktop PCs'
    ),
    true
  ),
  -- Smartphones (inherit from Mobile Devices -> Electronics)
  (
    gen_random_uuid(),
    'iPhone 15 Pro',
    'Latest flagship smartphone from Apple',
    'IPH-15-PRO-128',
    999.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Smartphones'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Samsung Galaxy S24 Ultra',
    'Premium Android smartphone',
    'SGS-S24U-256',
    1199.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Smartphones'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Google Pixel 8',
    'Pure Android experience',
    'GPX-8-128',
    699.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Smartphones'
    ),
    true
  ),
  -- Tablets (inherit from Mobile Devices -> Electronics)
  (
    gen_random_uuid(),
    'iPad Pro 12.9-inch',
    'Professional tablet with M2 chip',
    'IPD-PRO-129-M2',
    1099.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Tablets'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Surface Pro 9',
    'Versatile 2-in-1 tablet',
    'SFC-PRO-9-256',
    1299.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Tablets'
    ),
    true
  ),
  -- Gaming Consoles (inherit from Gaming -> Electronics)
  (
    gen_random_uuid(),
    'PlayStation 5',
    'Next-gen gaming console',
    'PS5-825GB',
    499.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Consoles'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Xbox Series X',
    'Powerful 4K gaming console',
    'XSX-1TB',
    499.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Consoles'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'Nintendo Switch OLED',
    'Portable gaming console',
    'NSW-OLED-64GB',
    349.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Consoles'
    ),
    true
  ),
  -- Gaming Accessories (inherit from Gaming -> Electronics)
  (
    gen_random_uuid(),
    'DualSense Wireless Controller',
    'PS5 wireless controller',
    'DS-WL-WHITE',
    69.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Gaming Accessories'
    ),
    true
  ),
  (
    gen_random_uuid(),
    'SteelSeries Arctis 7P',
    'Wireless gaming headset',
    'SS-A7P-BLACK',
    149.00,
    (
      SELECT id
      FROM categories
      WHERE name = 'Gaming Accessories'
    ),
    true
  );
SELECT 'Created 15 products across 7 categories' as status;
-- 6. Add realistic attribute values for products
-- This demonstrates how inherited attributes work in practice
-- MacBook Pro attribute values
WITH macbook AS (
  SELECT id
  FROM products
  WHERE name = 'MacBook Pro 16-inch'
),
attrs AS (
  SELECT id,
    name
  FROM attributes
  WHERE name IN (
      'Manufacturer',
      'Model Number',
      'Processor',
      'RAM',
      'Storage',
      'Operating System',
      'Screen Size',
      'Color',
      'Weight'
    )
)
INSERT INTO product_attribute_values (
    id,
    "productId",
    "attributeId",
    value,
    "createdAt"
  )
SELECT gen_random_uuid(),
  m.id,
  a.id,
  CASE
    a.name
    WHEN 'Manufacturer' THEN '"Apple"'
    WHEN 'Model Number' THEN '"MacBook Pro (16-inch, 2023)"'
    WHEN 'Processor' THEN '"Apple M2 Pro"'
    WHEN 'RAM' THEN '32'
    WHEN 'Storage' THEN '"1TB SSD"'
    WHEN 'Operating System' THEN '"macOS Sonoma"'
    WHEN 'Screen Size' THEN '16.2'
    WHEN 'Color' THEN '"Space Gray"'
    WHEN 'Weight' THEN '2.15'
  END::jsonb,
  NOW()
FROM macbook m,
  attrs a
WHERE CASE
    a.name
    WHEN 'Manufacturer' THEN '"Apple"'
    WHEN 'Model Number' THEN '"MacBook Pro (16-inch, 2023)"'
    WHEN 'Processor' THEN '"Apple M2 Pro"'
    WHEN 'RAM' THEN '32'
    WHEN 'Storage' THEN '"1TB SSD"'
    WHEN 'Operating System' THEN '"macOS Sonoma"'
    WHEN 'Screen Size' THEN '16.2'
    WHEN 'Color' THEN '"Space Gray"'
    WHEN 'Weight' THEN '2.15'
  END IS NOT NULL;
-- iPhone 15 Pro attribute values
WITH iphone AS (
  SELECT id
  FROM products
  WHERE name = 'iPhone 15 Pro'
),
attrs AS (
  SELECT id,
    name
  FROM attributes
  WHERE name IN (
      'Manufacturer',
      'Model Number',
      'Screen Size',
      'Battery Life',
      'Camera Resolution',
      'Network Type',
      'Storage',
      'Color',
      'Weight'
    )
)
INSERT INTO product_attribute_values (
    id,
    "productId",
    "attributeId",
    value,
    "createdAt"
  )
SELECT gen_random_uuid(),
  i.id,
  a.id,
  CASE
    a.name
    WHEN 'Manufacturer' THEN '"Apple"'
    WHEN 'Model Number' THEN '"iPhone 15 Pro"'
    WHEN 'Screen Size' THEN '6.1'
    WHEN 'Battery Life' THEN '23'
    WHEN 'Camera Resolution' THEN '48'
    WHEN 'Network Type' THEN '"5G"'
    WHEN 'Storage' THEN '"128GB"'
    WHEN 'Color' THEN '"Titanium Blue"'
    WHEN 'Weight' THEN '0.187'
  END::jsonb,
  NOW()
FROM iphone i,
  attrs a
WHERE CASE
    a.name
    WHEN 'Manufacturer' THEN '"Apple"'
    WHEN 'Model Number' THEN '"iPhone 15 Pro"'
    WHEN 'Screen Size' THEN '6.1'
    WHEN 'Battery Life' THEN '23'
    WHEN 'Camera Resolution' THEN '48'
    WHEN 'Network Type' THEN '"5G"'
    WHEN 'Storage' THEN '"128GB"'
    WHEN 'Color' THEN '"Titanium Blue"'
    WHEN 'Weight' THEN '0.187'
  END IS NOT NULL;
-- PlayStation 5 attribute values
WITH ps5 AS (
  SELECT id
  FROM products
  WHERE name = 'PlayStation 5'
),
attrs AS (
  SELECT id,
    name
  FROM attributes
  WHERE name IN (
      'Manufacturer',
      'Model Number',
      'Platform',
      'Max Resolution',
      'Controller Type',
      'Storage',
      'Color',
      'Weight'
    )
)
INSERT INTO product_attribute_values (
    id,
    "productId",
    "attributeId",
    value,
    "createdAt"
  )
SELECT gen_random_uuid(),
  p.id,
  a.id,
  CASE
    a.name
    WHEN 'Manufacturer' THEN '"Sony"'
    WHEN 'Model Number' THEN '"CFI-1200A01"'
    WHEN 'Platform' THEN '"PlayStation 5"'
    WHEN 'Max Resolution' THEN '"4K (2160p)"'
    WHEN 'Controller Type' THEN '"DualSense Wireless"'
    WHEN 'Storage' THEN '"825GB SSD"'
    WHEN 'Color' THEN '"White"'
    WHEN 'Weight' THEN '4.5'
  END::jsonb,
  NOW()
FROM ps5 p,
  attrs a
WHERE CASE
    a.name
    WHEN 'Manufacturer' THEN '"Sony"'
    WHEN 'Model Number' THEN '"CFI-1200A01"'
    WHEN 'Platform' THEN '"PlayStation 5"'
    WHEN 'Max Resolution' THEN '"4K (2160p)"'
    WHEN 'Controller Type' THEN '"DualSense Wireless"'
    WHEN 'Storage' THEN '"825GB SSD"'
    WHEN 'Color' THEN '"White"'
    WHEN 'Weight' THEN '4.5'
  END IS NOT NULL;
-- Add a few more quick attribute values for demonstration
-- Dell XPS 13
WITH dell AS (
  SELECT id
  FROM products
  WHERE name = 'Dell XPS 13'
),
manufacturer_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'Manufacturer'
),
processor_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'Processor'
),
ram_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'RAM'
)
INSERT INTO product_attribute_values (
    id,
    "productId",
    "attributeId",
    value,
    "createdAt"
  )
SELECT gen_random_uuid(),
  d.id,
  m.id,
  '"Dell"'::jsonb,
  NOW()
FROM dell d,
  manufacturer_attr m
UNION ALL
SELECT gen_random_uuid(),
  d.id,
  p.id,
  '"Intel Core i7-1260P"'::jsonb,
  NOW()
FROM dell d,
  processor_attr p
UNION ALL
SELECT gen_random_uuid(),
  d.id,
  r.id,
  '16'::jsonb,
  NOW()
FROM dell d,
  ram_attr r;
-- Gaming PC
WITH gaming_pc AS (
  SELECT id
  FROM products
  WHERE name = 'Gaming PC RTX 4080'
),
manufacturer_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'Manufacturer'
),
processor_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'Processor'
),
ram_attr AS (
  SELECT id
  FROM attributes
  WHERE name = 'RAM'
)
INSERT INTO product_attribute_values (
    id,
    "productId",
    "attributeId",
    value,
    "createdAt"
  )
SELECT gen_random_uuid(),
  g.id,
  m.id,
  '"Custom Build"'::jsonb,
  NOW()
FROM gaming_pc g,
  manufacturer_attr m
UNION ALL
SELECT gen_random_uuid(),
  g.id,
  p.id,
  '"AMD Ryzen 7 7800X3D"'::jsonb,
  NOW()
FROM gaming_pc g,
  processor_attr p
UNION ALL
SELECT gen_random_uuid(),
  g.id,
  r.id,
  '32'::jsonb,
  NOW()
FROM gaming_pc g,
  ram_attr r;
SELECT 'Added comprehensive attribute values for key products' as status;
-- 7. Refresh materialized views to include new data
REFRESH MATERIALIZED VIEW mv_category_hierarchy;
REFRESH MATERIALIZED VIEW mv_attribute_category_mapping;
REFRESH MATERIALIZED VIEW mv_attribute_search_vectors;
SELECT 'Materialized views refreshed with new data' as status;
-- 8. Final summary report
SELECT 'SETUP COMPLETE - Database populated with comprehensive test data' as summary;
SELECT 'Category structure:' as info;
WITH RECURSIVE category_tree AS (
  SELECT id,
    name,
    "parentId",
    0 as level,
    name as path
  FROM categories
  WHERE "parentId" IS NULL
  UNION ALL
  SELECT c.id,
    c.name,
    c."parentId",
    ct.level + 1,
    ct.path || ' > ' || c.name
  FROM categories c
    JOIN category_tree ct ON c."parentId" = ct.id
  WHERE ct.level < 5
)
SELECT REPEAT('  ', level) || name as hierarchy,
  level
FROM category_tree
ORDER BY path;
SELECT 'Product distribution by category:' as info;
SELECT c.name as category,
  COUNT(p.id) as product_count,
  string_agg(
    p.name,
    ', '
    ORDER BY p.name
  ) as products
FROM categories c
  LEFT JOIN products p ON c.id = p."categoryId"
WHERE p.id IS NOT NULL
GROUP BY c.id,
  c.name
ORDER BY COUNT(p.id) DESC,
  c.name;
SELECT 'Inheritance summary:' as info;
SELECT "linkType",
  COUNT(*) as links,
  COUNT(DISTINCT "categoryId") as categories,
  COUNT(DISTINCT "attributeId") as attributes
FROM category_attributes
GROUP BY "linkType"
ORDER BY "linkType";
SELECT 'Attribute coverage per product:' as info;
SELECT p.name as product,
  c.name as category,
  COUNT(pav.id) as attribute_values_set
FROM products p
  JOIN categories c ON p."categoryId" = c.id
  LEFT JOIN product_attribute_values pav ON p.id = pav."productId"
GROUP BY p.id,
  p.name,
  c.name
ORDER BY COUNT(pav.id) DESC,
  p.name;
