import { EntityManager } from "typeorm";

/**
 * Data migration to link attributes to categories
 * This creates the relationships between categories and their relevant attributes
 */
export async function run(manager: EntityManager): Promise<void> {
  console.log('Starting link category attributes migration...');

  // Check if category attributes already exist to avoid duplicates
  const existingLinks = await manager.query('SELECT COUNT(*) as count FROM category_attributes');
  if (parseInt(existingLinks[0].count) > 0) {
    console.log('Category attributes already exist, skipping migration');
    return;
  }

  // Get category and attribute IDs (assuming they exist from previous migrations)
  const categories = await manager.query('SELECT id, name FROM categories');
  const attributes = await manager.query('SELECT id, name FROM attributes');

  if (categories.length === 0 || attributes.length === 0) {
    console.log('Categories or attributes not found, skipping migration');
    return;
  }

  // Create a mapping of names to IDs for easier reference
  const categoryMap = new Map(categories.map((cat: any) => [cat.name, cat.id]));
  const attributeMap = new Map(attributes.map((attr: any) => [attr.name, attr.id]));

  // Define category-attribute relationships
  const categoryAttributeLinks = [
    // Electronics category attributes
    {
      categoryName: 'Electronics',
      attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Energy Efficient', 'Release Date'],
      linkType: 'direct'
    },
    // Smartphones subcategory attributes
    {
      categoryName: 'Smartphones',
      attributeNames: ['Brand', 'Color', 'Weight', 'Warranty Period', 'Release Date'],
      linkType: 'direct'
    },
    // Laptops subcategory attributes
    {
      categoryName: 'Laptops',
      attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Energy Efficient', 'Release Date'],
      linkType: 'direct'
    },
    // Audio Equipment subcategory attributes
    {
      categoryName: 'Audio Equipment',
      attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Release Date'],
      linkType: 'direct'
    },
    // Clothing category attributes
    {
      categoryName: 'Clothing',
      attributeNames: ['Brand', 'Color', 'Material'],
      linkType: 'direct'
    },
    // Home & Garden category attributes
    {
      categoryName: 'Home & Garden',
      attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Material', 'Warranty Period'],
      linkType: 'direct'
    },
    // Books category attributes
    {
      categoryName: 'Books',
      attributeNames: ['Brand', 'Weight', 'Dimensions', 'Release Date'],
      linkType: 'direct'
    }
  ];

  let insertedCount = 0;

  // Insert category-attribute links
  for (const link of categoryAttributeLinks) {
    const categoryId = categoryMap.get(link.categoryName);
    if (!categoryId) {
      console.log(`Category '${link.categoryName}' not found, skipping`);
      continue;
    }

    for (const attributeName of link.attributeNames) {
      const attributeId = attributeMap.get(attributeName);
      if (!attributeId) {
        console.log(`Attribute '${attributeName}' not found, skipping`);
        continue;
      }

      await manager.query(`
        INSERT INTO category_attributes (id, "categoryId", "attributeId", "linkType", "createdAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW())
      `, [categoryId, attributeId, link.linkType]);

      insertedCount++;
    }
  }

  console.log(`Inserted ${insertedCount} category-attribute links`);
  console.log('Link category attributes migration completed successfully');
}
