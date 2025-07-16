#!/usr/bin/env ts-node
import { config } from "dotenv";
import { getDataSource } from "./src/type-orm/data-source";

// Load environment variables
config();

async function runMigrations() {
  let dataSource;
  try {
    console.log('🚀 Running schema migrations...');
    dataSource = await getDataSource();
    console.log('✅ Database connected successfully');

    // Get migration status first
    const pending = await dataSource.showMigrations();
    console.log(`📊 Found ${pending.length} pending migrations`);

    if (pending.length > 0) {
      console.log('Running pending migrations:');
      pending.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });

      // Run migrations
      await dataSource.runMigrations();
      console.log('✅ All migrations completed successfully');
    } else {
      console.log('✅ No pending migrations');
    }

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

runMigrations();
