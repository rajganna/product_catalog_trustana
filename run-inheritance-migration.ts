#!/usr/bin/env ts-node
import { config } from "dotenv";
import { getDataSource } from "./src/type-orm/data-source";

// Load environment variables
config();

async function runInheritanceMigration() {
  let dataSource;
  try {
    console.log('🚀 Starting inheritance links setup...');
    dataSource = await getDataSource();
    console.log('✅ Database connected successfully');

    // Import and run the specific migration
    const migration = require('./data-migrations/20250714000001-setup-inheritance-links');
    console.log('📦 Migration file loaded');

    await migration.run(dataSource.manager);
    console.log('✅ Inheritance links migration completed successfully');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runInheritanceMigration();
