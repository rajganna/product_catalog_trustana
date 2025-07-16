"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = getDataSource;
exports.closeConnection = closeConnection;
exports.getConnection = getConnection;
exports.isConnected = isConnected;
const { DataSource } = require('typeorm');
const ormConfig = require("../../ormconfig");
require('dotenv').config();
let dataSource = null;
async function getDataSource() {
    if (dataSource === null || dataSource === void 0 ? void 0 : dataSource.isInitialized) {
        return dataSource;
    }
    dataSource = new DataSource({
        ...ormConfig,
        type: ormConfig.type,
        synchronize: false,
        logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
        maxQueryExecutionTime: 5000,
    });
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
        console.log('TypeORM DataSource initialized successfully');
    }
    return dataSource;
}
async function closeConnection() {
    if (dataSource === null || dataSource === void 0 ? void 0 : dataSource.isInitialized) {
        await dataSource.destroy();
        dataSource = null;
        console.log('TypeORM DataSource closed successfully');
    }
}
async function getConnection() {
    return getDataSource();
}
function isConnected() {
    var _a;
    return (_a = dataSource === null || dataSource === void 0 ? void 0 : dataSource.isInitialized) !== null && _a !== void 0 ? _a : false;
}
//# sourceMappingURL=data-source.js.map