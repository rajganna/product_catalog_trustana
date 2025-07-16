#!/bin/bash

# Quick Development Reset Script
# This script quickly resets the database with fresh test data without rebuilding everything

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

main() {
    print_status "Resetting database with fresh test data..."

    # Check if PostgreSQL is running (try both container names)
    if docker exec product-service-postgres pg_isready -U postgres >/dev/null 2>&1; then
        POSTGRES_CONTAINER="product-service-postgres"
    elif docker exec product-service-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        POSTGRES_CONTAINER="product-service-postgres-1"
    else
        echo "PostgreSQL is not running. Please run './setup-final.sh' first."
        exit 1
    fi

    # Clean and reload test data
    print_status "Cleaning existing data..."
    docker exec -i $POSTGRES_CONTAINER psql -U postgres -d product_service -c "
        DELETE FROM product_attribute_values;
        DELETE FROM products;
        DELETE FROM category_attributes WHERE \"linkType\" != 'direct' OR \"categoryId\" NOT IN (
            SELECT id FROM categories WHERE name IN ('Electronics', 'Global')
        );
    " >/dev/null 2>&1

    print_status "Reloading comprehensive test data..."
    docker exec -i $POSTGRES_CONTAINER psql -U postgres -d product_service < migrations/sql-scripts/setup-comprehensive-test-data.sql >/dev/null 2>&1

    print_status "Refreshing materialized views..."
    docker exec -i $POSTGRES_CONTAINER psql -U postgres -d product_service -c "
        REFRESH MATERIALIZED VIEW mv_category_hierarchy;
        REFRESH MATERIALIZED VIEW mv_attribute_category_mapping;
        REFRESH MATERIALIZED VIEW mv_attribute_search_vectors;
    " >/dev/null 2>&1

    print_success "Database reset complete!"

    # Show quick stats
    echo ""
    echo "📊 Current database state:"
    docker exec -i $POSTGRES_CONTAINER psql -U postgres -d product_service -c "
        SELECT
            (SELECT COUNT(*) FROM categories) as categories,
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM attributes) as attributes,
            (SELECT COUNT(*) FROM category_attributes) as attribute_links;
    " 2>/dev/null | grep -E "^\s*[0-9]" | head -1
}

main "$@"
