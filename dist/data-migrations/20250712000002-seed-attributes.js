"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
async function run(manager) {
    console.log('Starting seed attributes migration...');
    const existingAttributes = await manager.query('SELECT COUNT(*) as count FROM attributes');
    if (parseInt(existingAttributes[0].count) > 0) {
        console.log('Attributes already exist, skipping migration');
        return;
    }
    const attributes = [
        {
            id: '660e8400-e29b-41d4-a716-446655440000',
            name: 'Brand',
            description: 'Product brand or manufacturer',
            type: 'text',
            options: null,
            isRequired: true,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440001',
            name: 'Color',
            description: 'Product color',
            type: 'select',
            options: JSON.stringify(['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Gray']),
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440002',
            name: 'Weight',
            description: 'Product weight in grams',
            type: 'number',
            options: null,
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440003',
            name: 'Dimensions',
            description: 'Product dimensions (Length x Width x Height)',
            type: 'text',
            options: null,
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440004',
            name: 'Material',
            description: 'Primary material used in the product',
            type: 'multi_select',
            options: JSON.stringify(['Plastic', 'Metal', 'Wood', 'Glass', 'Fabric', 'Leather', 'Rubber', 'Ceramic']),
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440005',
            name: 'Warranty Period',
            description: 'Product warranty period in months',
            type: 'number',
            options: null,
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440006',
            name: 'Energy Efficient',
            description: 'Whether the product is energy efficient',
            type: 'boolean',
            options: null,
            isRequired: false,
            isActive: true
        },
        {
            id: '660e8400-e29b-41d4-a716-446655440007',
            name: 'Release Date',
            description: 'Product release or launch date',
            type: 'date',
            options: null,
            isRequired: false,
            isActive: true
        }
    ];
    for (const attribute of attributes) {
        await manager.query(`
      INSERT INTO attributes (id, name, description, type, options, "isRequired", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [
            attribute.id,
            attribute.name,
            attribute.description,
            attribute.type,
            attribute.options,
            attribute.isRequired,
            attribute.isActive
        ]);
    }
    console.log(`Inserted ${attributes.length} common attributes`);
    console.log('Seed attributes migration completed successfully');
}
//# sourceMappingURL=20250712000002-seed-attributes.js.map