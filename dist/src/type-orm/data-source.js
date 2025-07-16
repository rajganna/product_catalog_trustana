"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = getConnection;
exports.closeConnection = closeConnection;
const typeorm_1 = require("typeorm");
const ormConfig = require("../../ormconfig");
require('dotenv').config();
async function getConnection() {
    try {
        return (0, typeorm_1.getConnection)();
    }
    catch {
        return await (0, typeorm_1.createConnection)(ormConfig);
    }
}
async function closeConnection() {
    try {
        const connection = (0, typeorm_1.getConnection)();
        if (connection.isConnected) {
            await connection.close();
        }
    }
    catch {
    }
}
//# sourceMappingURL=data-source.js.map