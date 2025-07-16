import { config } from "dotenv";
import { readdirSync } from "fs";
import { basename, join } from "path";
import { getDataSource } from "../src/type-orm/data-source";

// Load environment variables
config();

// Simple logger for data migrations
class MigrationLogger {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] [DATA-MIGRATION] ${message}`);
  }

  error(error: { message: string; reason?: string; stack?: string }) {
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
const folderBasename = basename(__filename);
let exitCode = 0;

logger.log('Data Migration started');

const files = readdirSync(__dirname)
  .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== folderBasename)
  .sort((a, b) => a.localeCompare(b));

(async () => {
  let dataSource;
  try {
    dataSource = await getDataSource();
    logger.log('Database connection established');

    for (const file of files) {
      logger.log(`Start migration: ${file}`);
      const migration = require(join(__dirname, file));

      if (typeof migration.run === 'function') {
        await migration.run(dataSource.manager);
        logger.log(`Migration completed successfully: ${file}`);
      } else {
        logger.log(`Skipping ${file} - no run function found`);
      }
    }
  } catch (e: any) {
    logger.error({
      message: 'Migration failed',
      reason: e.message,
      stack: e.stack
    });
    exitCode = 1;
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      logger.log('Database connection closed');
    }
  }

  logger.log('Data Migration completed');
  process.exit(exitCode);
})();
