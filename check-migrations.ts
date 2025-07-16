#!/usr/bin/env ts-node
import { config } from "dotenv";
import { getDataSource } from "./src/type-orm/data-source";

// Load environment variables
config();

async function checkMigrations() {
  let dataSource;
  try {
    console.log('🔍 Checking migration status...');
    dataSource = await getDataSource();
    console.log('✅ Database connected successfully');

    // Check pending migrations
    const pending = await dataSource.showMigrations();
    console.log(`📊 Found ${pending.length} pending migrations`);

    if (pending.length > 0) {
      console.log('\nPending migrations:');
      pending.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name} (${migration.timestamp})`);
      });
    } else {
      console.log('✅ All migrations are up to date');
    }

    // Also check completed migrations
    const executed = await dataSource.query(`SELECT id, name, timestamp FROM migrations ORDER BY timestamp`);
    console.log(`\n📚 Executed migrations (${executed.length}):`);
    executed.forEach((migration: any, index: number) => {
      console.log(`  ${index + 1}. ${migration.name} (${migration.timestamp})`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

checkMigrations();
