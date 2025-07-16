#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

main() {
    print_status "Setting up database schema and test data..."

    # Check if PostgreSQL is running
    if ! docker exec product-service-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        echo "PostgreSQL is not running. Please start it first:"
        echo "docker run -d --name product-service-postgres-1 -e POSTGRES_DB=product_service -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15"
        exit 1
    fi

    print_status "PostgreSQL is ready"

    # Create basic tables (run the base migration content)
    print_status "Creating basic database schema..."
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service -c "
        -- Basic migrations table
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL,
            UNIQUE(timestamp)
        );

        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            \"parentId\" UUID REFERENCES categories(id),
            \"createdAt\" TIMESTAMP DEFAULT NOW(),
            \"updatedAt\" TIMESTAMP DEFAULT NOW()
        );

        -- Attributes table
        CREATE TABLE IF NOT EXISTS attributes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL,
            \"isRequired\" BOOLEAN DEFAULT false,
            \"isActive\" BOOLEAN DEFAULT true,
            \"createdAt\" TIMESTAMP DEFAULT NOW(),
            \"updatedAt\" TIMESTAMP DEFAULT NOW()
        );

        -- Category-Attributes junction table
        CREATE TABLE IF NOT EXISTS category_attributes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"categoryId\" UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            \"attributeId\" UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
            \"linkType\" VARCHAR(20) DEFAULT 'direct',
            \"createdAt\" TIMESTAMP DEFAULT NOW(),
            UNIQUE(\"categoryId\", \"attributeId\")
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            sku VARCHAR(100) UNIQUE,
            price DECIMAL(10,2),
            \"categoryId\" UUID REFERENCES categories(id),
            \"isActive\" BOOLEAN DEFAULT true,
            \"createdAt\" TIMESTAMP DEFAULT NOW(),
            \"updatedAt\" TIMESTAMP DEFAULT NOW()
        );

        -- Product-Attribute values table
        CREATE TABLE IF NOT EXISTS product_attribute_values (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"productId\" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            \"attributeId\" UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
            value JSONB,
            \"createdAt\" TIMESTAMP DEFAULT NOW(),
            \"updatedAt\" TIMESTAMP DEFAULT NOW(),
            UNIQUE(\"productId\", \"attributeId\")
        );

        -- Basic indexes
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(\"parentId\");
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(\"categoryId\");
        CREATE INDEX IF NOT EXISTS idx_products_active ON products(\"isActive\");
        CREATE INDEX IF NOT EXISTS idx_category_attributes_category ON category_attributes(\"categoryId\");
        CREATE INDEX IF NOT EXISTS idx_category_attributes_attribute ON category_attributes(\"attributeId\");
        CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product ON product_attribute_values(\"productId\");
        CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute ON product_attribute_values(\"attributeId\");
    " >/dev/null 2>&1

    print_success "Basic schema created"

    # Apply search optimizations
    print_status "Applying search optimizations..."
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/apply-search-migrations.sql >/dev/null 2>&1

    # Create materialized views
    print_status "Creating materialized views..."
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/create-materialized-views.sql >/dev/null 2>&1

    # Setup test data
    print_status "Creating comprehensive test dataset..."
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/setup-comprehensive-test-data.sql >/dev/null 2>&1

    print_success "Database setup complete!"

    # Show statistics
    print_status "Database statistics:"
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service -c "
        SELECT
            (SELECT COUNT(*) FROM categories) as categories,
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM attributes) as attributes,
            (SELECT COUNT(*) FROM category_attributes) as attribute_links;
    " 2>/dev/null

    print_success "Setup complete! Database is ready with comprehensive test data."
}

main "$@"
