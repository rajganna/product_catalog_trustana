"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
class MigrationLogger {
    log(message) {
        console.log(`[${new Date().toISOString()}] [DATA-MIGRATION] ${message}`);
    }
    error(error) {
        console.error(`[${new Date().toISOString()}] [DATA-MIGRATION] ERROR: ${error.message}`);
        if (error.reason) {
            console.error(`[${new Date().toISOString()}] [DATA-MIGRATION] REASON: ${error.reason}`);
        }
        if (error.stack) {
            console.error(`[${new Date().toISOString()}] [DATA-MIGRATION] STACK: ${error.stack}`);
        }
    }
}
const logger = new MigrationLogger();
const folderBasename = (0, path_1.basename)(__filename);
let exitCode = 0;
logger.log('Data Migration started');
const files = (0, fs_1.readdirSync)(__dirname)
    .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== folderBasename)
    .sort((a, b) => a.localeCompare(b));
(async () => {
    const ormConfig = require('../ormconfig.js');
    let connection;
    try {
        connection = await (0, typeorm_1.createConnection)(ormConfig);
        logger.log('Database connection established');
        for (const file of files) {
            logger.log(`Start migration: ${file}`);
            const migration = require((0, path_1.join)(__dirname, file));
            if (typeof migration.run === 'function') {
                await migration.run(connection.manager);
                logger.log(`Migration completed successfully: ${file}`);
            }
            else {
                logger.log(`Skipping ${file} - no run function found`);
            }
        }
    }
    catch (e) {
        logger.error({
            message: 'Migration failed',
            reason: e.message,
            stack: e.stack
        });
        exitCode = 1;
    }
    finally {
        if (connection === null || connection === void 0 ? void 0 : connection.isConnected) {
            await connection.close();
            logger.log('Database connection closed');
        }
    }
    logger.log('Data Migration completed');
    process.exit(exitCode);
})();
//# sourceMappingURL=index.js.map