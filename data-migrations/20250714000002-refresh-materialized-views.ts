import { EntityManager } from "typeorm";

/**
 * Data migration to refresh materialized views after inheritance links setup
 * This ensures that materialized views reflect the new inheritance relationships
 */
export async function run(manager: EntityManager): Promise<void> {
  console.log('Starting refresh materialized views after inheritance setup...');

  try {
    // Check if materialized views exist
    const viewsExist = await manager.query(`
      SELECT COUNT(*) as count
      FROM pg_matviews
      WHERE matviewname IN ('mv_category_hierarchy', 'mv_attribute_category_mapping', 'mv_attribute_search_vectors')
    `);

    if (parseInt(viewsExist[0].count) === 0) {
      console.log('Materialized views do not exist yet. Run schema migrations first.');
      console.log('Command: npm run db:migrate');
      return;
    }

    console.log('🔄 Refreshing materialized views to include inheritance links...');

    // Refresh category hierarchy view
    console.log('  📊 Refreshing mv_category_hierarchy...');
    await manager.query('REFRESH MATERIALIZED VIEW mv_category_hierarchy');

    // Refresh attribute category mapping view
    console.log('  🔗 Refreshing mv_attribute_category_mapping...');
    await manager.query('REFRESH MATERIALIZED VIEW mv_attribute_category_mapping');

    // Refresh attribute search vectors view
    console.log('  🔍 Refreshing mv_attribute_search_vectors...');
    await manager.query('REFRESH MATERIALIZED VIEW mv_attribute_search_vectors');

    console.log('✅ All materialized views refreshed successfully');

    // Verify the inheritance links are working in materialized views
    console.log('\n🔍 Verifying inheritance in materialized views...');

    const inheritanceVerification = await manager.query(`
      SELECT
        link_type,
        COUNT(*) as count,
        COUNT(DISTINCT attribute_id) as unique_attributes,
        COUNT(DISTINCT category_id) as unique_categories
      FROM mv_attribute_category_mapping
      GROUP BY link_type
      ORDER BY
        CASE link_type
          WHEN 'direct' THEN 1
          WHEN 'inherited' THEN 2
          WHEN 'global' THEN 3
        END
    `);

    console.log('\nMaterialized view inheritance summary:');
    inheritanceVerification.forEach((row: any) => {
      console.log(`  ${row.link_type}: ${row.count} mappings (${row.unique_attributes} attributes, ${row.unique_categories} categories)`);
    });

    // Show some example inheritance chains
    console.log('\n📋 Example inheritance chains:');
    const exampleChains = await manager.query(`
      SELECT
        c.name as category_name,
        a.name as attribute_name,
        acm.link_type,
        acm.category_path
      FROM mv_attribute_category_mapping acm
      JOIN categories c ON acm.category_id = c.id
      JOIN attributes a ON acm.attribute_id = a.id
      WHERE acm.link_type = 'inherited'
      ORDER BY acm.category_path, a.name
      LIMIT 10
    `);

    exampleChains.forEach((chain: any) => {
      console.log(`  📂 ${chain.category_name} (${chain.category_path}) -> 🏷️ ${chain.attribute_name} [${chain.link_type}]`);
    });

    console.log('\n✅ Materialized views refresh completed successfully');

  } catch (error: any) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('⚠️  Materialized views not found. This is expected if schema migrations haven\'t been run yet.');
      console.log('   Run: npm run db:migrate');
      console.log('   Then run data migrations again: npm run db:migrate:data');
    } else {
      console.error('❌ Error refreshing materialized views:', error.message);
      throw error;
    }
  }
}
