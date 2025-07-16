"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'product_service',
    entities: [`${__dirname}/src/entities/**/*.entity{.ts,.js}`],
    migrations: ['migrations/*.ts'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'local' ? ['query', 'error'] : ['error'],
});
//# sourceMappingURL=datasource.js.map