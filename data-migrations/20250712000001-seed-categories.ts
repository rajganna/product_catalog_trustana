import { EntityManager } from "typeorm";

/**
 * Data migration to seed initial product categories
 * This creates the basic category structure for the product catalog
 */
export async function run(manager: EntityManager): Promise<void> {
  console.log('Starting seed categories migration...');

  // Check if categories already exist to avoid duplicates
  const existingCategories = await manager.query('SELECT COUNT(*) as count FROM categories');
  if (parseInt(existingCategories[0].count) > 0) {
    console.log('Categories already exist, skipping migration');
    return;
  }

  // Create root categories
  const rootCategories = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Electronics',
      description: 'Electronic devices and components',
      parentId: null
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Clothing',
      description: 'Apparel and fashion items',
      parentId: null
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
      parentId: null
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Books',
      description: 'Books and educational materials',
      parentId: null
    }
  ];

  // Insert root categories
  for (const category of rootCategories) {
    await manager.query(`
      INSERT INTO categories (id, name, description, "parentId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [category.id, category.name, category.description, category.parentId]);
  }

  // Create subcategories for Electronics
  const electronicsSubcategories = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      parentId: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Laptops',
      description: 'Portable computers and accessories',
      parentId: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'Audio Equipment',
      description: 'Speakers, headphones, and audio devices',
      parentId: '550e8400-e29b-41d4-a716-446655440000'
    }
  ];

  // Insert electronics subcategories
  for (const category of electronicsSubcategories) {
    await manager.query(`
      INSERT INTO categories (id, name, description, "parentId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [category.id, category.name, category.description, category.parentId]);
  }

  console.log(`Inserted ${rootCategories.length} root categories and ${electronicsSubcategories.length} subcategories`);
  console.log('Seed categories migration completed successfully');
}
