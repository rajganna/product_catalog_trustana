# SQL Scripts for Product Service Migrations

This directory contains SQL scripts used for setting up and managing the product service database schema and test data.

## 📁 **File Organization**

### Schema Migration Scripts
- `apply-search-migrations.sql` - Applies product and attribute search optimization columns and indexes
- `create-category-hierarchy.sql` - Creates the materialized view for category hierarchy navigation
- `create-materialized-views.sql` - Creates all materialized views for search optimization
- `create-attr-category-mapping.sql` - Creates materialized view for attribute-category mappings
- `create-attr-search-vectors.sql` - Creates materialized view for attribute search vectors

### Data Setup Scripts
- `setup-comprehensive-test-data.sql` - Creates comprehensive test dataset with 15+ products, categories, and attributes
- `setup-inheritance.sql` - Sets up basic attribute inheritance links
- `setup-inheritance-fixed.sql` - Enhanced inheritance setup with recursive logic
- `complete-inheritance.sql` - Final inheritance link creation script

### Data Cleanup Scripts
- `fix-category-hierarchy.sql` - Fixes category parent-child relationships and removes duplicates
- `consolidate-electronics.sql` - Consolidates duplicate Electronics categories into one proper hierarchy

### Validation Scripts
- `validate-comprehensive-dataset.sql` - Comprehensive validation and reporting of the database setup

### Legacy/Unused Files
- `Product Service DB.session.sql` - Empty session file (can be deleted)

## 🚀 **Usage Instructions**

### Setting Up Fresh Database
```bash
# 1. Apply schema migrations first
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/apply-search-migrations.sql

# 2. Create materialized views
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/create-materialized-views.sql

# 3. Set up comprehensive test data
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/setup-comprehensive-test-data.sql

# 4. Validate setup
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/validate-comprehensive-dataset.sql
```

### Fixing Existing Database Issues
```bash
# Fix category hierarchy if needed
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/fix-category-hierarchy.sql

# Consolidate duplicate categories
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/consolidate-electronics.sql

# Set up proper inheritance
docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/complete-inheritance.sql
```

## 📊 **What Each Script Accomplishes**

### Schema Scripts
- Add search optimization columns to products and attributes tables
- Create indexes for fast searching and filtering
- Set up materialized views for complex queries
- Enable full-text search with PostgreSQL GIN indexes

### Data Scripts
- Create realistic product catalog with electronics categories
- Demonstrate 3-level category hierarchy (Electronics > Computing > Desktop PCs)
- Set up attribute inheritance (direct, inherited, global)
- Populate products with realistic attribute values

### Validation Scripts
- Verify category hierarchy structure
- Check inheritance link counts and distribution
- Show product-attribute coverage
- Demonstrate inheritance with specific examples

## 🔧 **Maintenance**

### Refreshing Materialized Views
```sql
REFRESH MATERIALIZED VIEW mv_category_hierarchy;
REFRESH MATERIALIZED VIEW mv_attribute_category_mapping;
REFRESH MATERIALIZED VIEW mv_attribute_search_vectors;
```

### Checking Database Health
Run `validate-comprehensive-dataset.sql` to get a full report on:
- Category hierarchy structure
- Inheritance link distribution
- Product attribute coverage
- Materialized view status
- Overall database statistics

## 📝 **Notes**

- All scripts are idempotent where possible (use IF NOT EXISTS, ON CONFLICT DO NOTHING)
- Foreign key constraints are respected during cleanup operations
- Materialized views should be refreshed after data changes
- Scripts are designed to work with PostgreSQL-specific features (JSONB, GIN indexes, recursive CTEs)

## 🎯 **Current Status**

✅ **Complete and validated setup with:**
- 15 products across 7 categories
- 22 attributes with proper inheritance
- 91 total attribute-category links
- All materialized views populated and indexed
- Full search optimization ready

## 🧹 **Project Cleanup**

✅ **All temporary test files have been removed from the project root:**
- Test TypeScript files (test-*.ts) moved to proper locations or deleted
- Validation JavaScript files (validate-*.js) cleaned up
- Demonstration scripts (demonstrate-*.js) removed
- Only production code and organized SQL scripts remain
