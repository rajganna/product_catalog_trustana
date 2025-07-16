import { EntityManager } from "typeorm";

/**
 * Data migration to setup inheritance links between categories and attributes
 * This creates inherited attribute relationships where child categories automatically
 * inherit attributes from their parent categories
 */
export async function run(manager: EntityManager): Promise<void> {
  console.log('Starting setup inheritance links migration...');

  // Check if inherited links already exist to avoid duplicates
  const existingInheritedLinks = await manager.query(`
    SELECT COUNT(*) as count
    FROM category_attributes
    WHERE "linkType" = 'inherited'
  `);

  if (parseInt(existingInheritedLinks[0].count) > 0) {
    console.log('Inherited attribute links already exist, skipping migration');
    return;
  }

  // Get all categories with their parent relationships
  const categories = await manager.query(`
    SELECT id, name, "parentId"
    FROM categories
    ORDER BY name
  `);

  // Get all direct attribute links (parent -> attribute relationships)
  const directLinks = await manager.query(`
    SELECT ca.*, c.name as category_name, a.name as attribute_name
    FROM category_attributes ca
    JOIN categories c ON ca."categoryId" = c.id
    JOIN attributes a ON ca."attributeId" = a.id
    WHERE ca."linkType" = 'direct'
  `);

  if (categories.length === 0 || directLinks.length === 0) {
    console.log('Categories or direct attribute links not found, skipping inheritance setup');
    return;
  }

  // Create category hierarchy map
  const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]));
  const parentToChildrenMap = new Map();

  // Build parent -> children mapping
  categories.forEach((cat: any) => {
    if (cat.parentId) {
      if (!parentToChildrenMap.has(cat.parentId)) {
        parentToChildrenMap.set(cat.parentId, []);
      }
      parentToChildrenMap.get(cat.parentId).push(cat);
    }
  });

  // Group direct links by category
  const categoryDirectLinks = new Map();
  directLinks.forEach((link: any) => {
    if (!categoryDirectLinks.has(link.categoryId)) {
      categoryDirectLinks.set(link.categoryId, []);
    }
    categoryDirectLinks.get(link.categoryId).push(link);
  });

  let inheritedLinksCount = 0;

  /**
   * Recursively create inherited links for all descendants of a category
   */
  async function createInheritedLinksForDescendants(
    parentCategoryId: string,
    attributeId: string,
    visited = new Set()
  ): Promise<void> {
    // Prevent infinite recursion
    if (visited.has(parentCategoryId)) return;
    visited.add(parentCategoryId);

    const children = parentToChildrenMap.get(parentCategoryId) || [];

    for (const childCategory of children) {
      // Check if this inherited link already exists
      const existingLink = await manager.query(`
        SELECT id FROM category_attributes
        WHERE "categoryId" = $1 AND "attributeId" = $2
      `, [childCategory.id, attributeId]);

      if (existingLink.length === 0) {
        // Create inherited link
        await manager.query(`
          INSERT INTO category_attributes (id, "categoryId", "attributeId", "linkType", "createdAt")
          VALUES (uuid_generate_v4(), $1, $2, 'inherited', NOW())
        `, [childCategory.id, attributeId]);

        inheritedLinksCount++;
        console.log(`  ✅ Created inherited link: ${childCategory.name} <- ${(categoryMap.get(parentCategoryId) as any)?.name} (attribute)`);
      }

      // Recursively create links for this child's descendants
      await createInheritedLinksForDescendants(childCategory.id, attributeId, visited);
    }
  }

  // Process each category's direct attributes and create inherited links for all descendants
  console.log('Creating inherited attribute links...');

  for (const [categoryId, links] of categoryDirectLinks.entries()) {
    const category = categoryMap.get(categoryId);
    console.log(`\n📂 Processing category: ${(category as any)?.name}`);

    for (const link of links) {
      console.log(`  🔗 Processing attribute: ${link.attribute_name}`);
      await createInheritedLinksForDescendants(categoryId, link.attributeId);
    }
  }

  // Setup specific inheritance rules for better attribute organization
  console.log('\n🔧 Setting up specific inheritance rules...');

  // Example: All Electronics subcategories should inherit common electronic attributes
  const electronicsCategory = categories.find((cat: any) => cat.name === 'Electronics');
  if (electronicsCategory) {
    const commonElectronicsAttributes = await manager.query(`
      SELECT a.id, a.name
      FROM attributes a
      WHERE a.name IN ('Brand', 'Warranty Period', 'Energy Efficient', 'Weight')
    `);

    const electronicsChildren = await manager.query(`
      SELECT id, name FROM categories WHERE "parentId" = $1
    `, [electronicsCategory.id]);

    for (const child of electronicsChildren) {
      for (const attr of commonElectronicsAttributes) {
        const existing = await manager.query(`
          SELECT id FROM category_attributes
          WHERE "categoryId" = $1 AND "attributeId" = $2
        `, [child.id, attr.id]);

        if (existing.length === 0) {
          await manager.query(`
            INSERT INTO category_attributes (id, "categoryId", "attributeId", "linkType", "createdAt")
            VALUES (uuid_generate_v4(), $1, $2, 'inherited', NOW())
          `, [child.id, attr.id]);

          inheritedLinksCount++;
          console.log(`  ✅ Electronics inheritance: ${child.name} <- ${attr.name}`);
        }
      }
    }
  }

  // Setup global attributes that should be available to all categories
  console.log('\n🌐 Setting up global attributes...');

  const globalAttributes = await manager.query(`
    SELECT id, name FROM attributes
    WHERE name IN ('Color', 'Brand', 'Weight', 'Dimensions')
  `);

  for (const globalAttr of globalAttributes) {
    // Check if this attribute is already linked to any category
    const existingGlobalLink = await manager.query(`
      SELECT COUNT(*) as count FROM category_attributes
      WHERE "attributeId" = $1 AND "linkType" = 'global'
    `, [globalAttr.id]);

    if (parseInt(existingGlobalLink[0].count) === 0) {
      // Create a single global link entry (not tied to specific categories)
      await manager.query(`
        INSERT INTO category_attributes (id, "categoryId", "attributeId", "linkType", "createdAt")
        VALUES (uuid_generate_v4(), NULL, $1, 'global', NOW())
      `, [globalAttr.id]);

      inheritedLinksCount++;
      console.log(`  ✅ Global attribute: ${globalAttr.name}`);
    }
  }

  // Create summary report
  console.log('\n📊 Inheritance Links Summary:');
  const finalCounts = await manager.query(`
    SELECT
      "linkType",
      COUNT(*) as count
    FROM category_attributes
    GROUP BY "linkType"
    ORDER BY "linkType"
  `);

  finalCounts.forEach((row: any) => {
    console.log(`  ${row.linkType}: ${row.count} links`);
  });

  console.log(`\n✅ Created ${inheritedLinksCount} new inherited attribute links`);
  console.log('Setup inheritance links migration completed successfully');

  // Validate inheritance chain
  console.log('\n🔍 Validating inheritance chains...');
  const validationQuery = await manager.query(`
    WITH RECURSIVE category_tree AS (
      -- Root categories
      SELECT id, name, "parentId", 0 as depth, ARRAY[name] as path
      FROM categories
      WHERE "parentId" IS NULL

      UNION ALL

      -- Child categories
      SELECT c.id, c.name, c."parentId", ct.depth + 1, ct.path || c.name
      FROM categories c
      JOIN category_tree ct ON c."parentId" = ct.id
      WHERE ct.depth < 10
    ),
    attribute_inheritance AS (
      SELECT
        ct.name as category_name,
        ct.depth,
        ct.path,
        COUNT(ca.id) as total_attributes,
        COUNT(CASE WHEN ca."linkType" = 'direct' THEN 1 END) as direct_attributes,
        COUNT(CASE WHEN ca."linkType" = 'inherited' THEN 1 END) as inherited_attributes,
        COUNT(CASE WHEN ca."linkType" = 'global' THEN 1 END) as global_attributes
      FROM category_tree ct
      LEFT JOIN category_attributes ca ON ct.id = ca."categoryId"
      GROUP BY ct.id, ct.name, ct.depth, ct.path
    )
    SELECT * FROM attribute_inheritance
    WHERE total_attributes > 0
    ORDER BY depth, category_name
  `);

  console.log('\nInheritance validation results:');
  validationQuery.forEach((row: any) => {
    const indent = '  '.repeat(row.depth);
    console.log(`${indent}${row.category_name}: ${row.total_attributes} total (${row.direct_attributes} direct, ${row.inherited_attributes} inherited, ${row.global_attributes} global)`);
  });
}
