"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
async function run(manager) {
    console.log('Starting link category attributes migration...');
    const existingLinks = await manager.query('SELECT COUNT(*) as count FROM category_attributes');
    if (parseInt(existingLinks[0].count) > 0) {
        console.log('Category attributes already exist, skipping migration');
        return;
    }
    const categories = await manager.query('SELECT id, name FROM categories');
    const attributes = await manager.query('SELECT id, name FROM attributes');
    if (categories.length === 0 || attributes.length === 0) {
        console.log('Categories or attributes not found, skipping migration');
        return;
    }
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));
    const attributeMap = new Map(attributes.map((attr) => [attr.name, attr.id]));
    const categoryAttributeLinks = [
        {
            categoryName: 'Electronics',
            attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Energy Efficient', 'Release Date'],
            linkType: 'direct'
        },
        {
            categoryName: 'Smartphones',
            attributeNames: ['Brand', 'Color', 'Weight', 'Warranty Period', 'Release Date'],
            linkType: 'direct'
        },
        {
            categoryName: 'Laptops',
            attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Energy Efficient', 'Release Date'],
            linkType: 'direct'
        },
        {
            categoryName: 'Audio Equipment',
            attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Warranty Period', 'Release Date'],
            linkType: 'direct'
        },
        {
            categoryName: 'Clothing',
            attributeNames: ['Brand', 'Color', 'Material'],
            linkType: 'direct'
        },
        {
            categoryName: 'Home & Garden',
            attributeNames: ['Brand', 'Color', 'Weight', 'Dimensions', 'Material', 'Warranty Period'],
            linkType: 'direct'
        },
        {
            categoryName: 'Books',
            attributeNames: ['Brand', 'Weight', 'Dimensions', 'Release Date'],
            linkType: 'direct'
        }
    ];
    let insertedCount = 0;
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
//# sourceMappingURL=20250712000003-link-category-attributes.js.map