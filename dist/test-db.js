"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const TestDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 9002,
    username: 'postgres',
    password: 'postgres',
    database: 'product_service',
    entities: [`${__dirname}/src/entities/**/*.entity{.ts,.js}`],
    synchronize: false,
    logging: true,
});
async function testConnection() {
    try {
        await TestDataSource.initialize();
        console.log('✅ Database connection successful!');
        const queryRunner = TestDataSource.createQueryRunner();
        const category = await queryRunner.query(`
      INSERT INTO categories (name, description)
      VALUES ('Electronics', 'Electronic devices and accessories')
      RETURNING *
    `);
        console.log('✅ Created category:', category[0]);
        const attribute = await queryRunner.query(`
      INSERT INTO attributes (name, description, type, "isRequired")
      VALUES ('Brand', 'Product brand name', 'text', true)
      RETURNING *
    `);
        console.log('✅ Created attribute:', attribute[0]);
        await queryRunner.query(`
      INSERT INTO category_attributes ("categoryId", "attributeId", "linkType")
      VALUES ($1, $2, 'direct')
    `, [category[0].id, attribute[0].id]);
        console.log('✅ Linked attribute to category');
        const product = await queryRunner.query(`
      INSERT INTO products (name, description, sku, price, "categoryId")
      VALUES ('iPhone 15', 'Latest iPhone model', 'IPHONE15-128', 999.99, $1)
      RETURNING *
    `, [category[0].id]);
        console.log('✅ Created product:', product[0]);
        await queryRunner.query(`
      INSERT INTO product_attribute_values ("productId", "attributeId", value)
      VALUES ($1, $2, $3)
    `, [product[0].id, attribute[0].id, JSON.stringify({ value: 'Apple' })]);
        console.log('✅ Added product attribute value');
        await queryRunner.release();
        await TestDataSource.destroy();
        console.log('🎉 All tests passed! Product catalog system is working correctly.');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
testConnection();
//# sourceMappingURL=test-db.js.map