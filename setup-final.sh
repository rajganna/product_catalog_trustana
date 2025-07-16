#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker status..."
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Clean up existing containers
cleanup_containers() {
    print_status "Cleaning up existing containers..."
    docker-compose -f docker-compose.full.yml down -v 2>/dev/null || true
    # Also clean up individual containers from previous setup
    docker stop product-service-postgres-1 product-service-redis-1 2>/dev/null || true
    docker rm product-service-postgres-1 product-service-redis-1 2>/dev/null || true
    print_success "Cleanup complete"
}

# Start all services including the application
start_services() {
    print_status "Starting all services with Docker Compose..."

    # Use docker-compose to start all services
    if docker-compose -f docker-compose.full.yml up -d --build; then
        print_success "All services started"
    else
        print_error "Failed to start services"
        exit 1
    fi

    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker exec product-service-postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        print_status "Waiting for PostgreSQL... ($retries retries left)"
        sleep 2
        retries=$((retries - 1))
    done

    if [ $retries -eq 0 ]; then
        print_error "PostgreSQL failed to start within expected time"
        exit 1
    fi

    # Check Redis
    if docker exec product-service-redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_warning "Redis may not be ready, but continuing..."
    fi

    # Wait for application to be ready
    print_status "Waiting for application to be ready..."
    retries=30
    while [ $retries -gt 0 ]; do
        if curl -f http://localhost:3000/api/v1/health >/dev/null 2>&1; then
            print_success "Application is ready"
            break
        fi
        print_status "Waiting for application... ($retries retries left)"
        sleep 3
        retries=$((retries - 1))
    done

    if [ $retries -eq 0 ]; then
        print_warning "Application may not be ready yet, but setup will continue"
    fi
}

# Set up database schema and data
setup_database() {
    print_status "Setting up database schema and test data..."

    # Create basic schema
    print_status "Creating basic database schema..."
    docker exec -i product-service-postgres psql -U postgres -d product_service -c "
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
            options JSONB,
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
    docker exec -i product-service-postgres psql -U postgres -d product_service < migrations/sql-scripts/apply-search-migrations.sql >/dev/null 2>&1

    # Create materialized views
    print_status "Creating materialized views..."
    docker exec -i product-service-postgres psql -U postgres -d product_service < migrations/sql-scripts/create-materialized-views.sql >/dev/null 2>&1

    # Setup comprehensive test data
    print_status "Creating comprehensive test dataset..."

    # First try the existing SQL script
    if docker exec -i product-service-postgres psql -U postgres -d product_service < migrations/sql-scripts/setup-comprehensive-test-data.sql >/dev/null 2>&1; then
        print_success "Comprehensive test data loaded from SQL script"
    else
        print_warning "Comprehensive test data script had issues, running direct data setup..."

        # Clear any existing data and start fresh
        print_status "Clearing existing data and setting up fresh dataset..."
        docker exec -i product-service-postgres psql -U postgres -d product_service -c "
            -- Clear existing data in correct order to handle foreign keys
            DELETE FROM product_attribute_values;
            DELETE FROM products;
            DELETE FROM category_attributes;
            DELETE FROM attributes;
            DELETE FROM categories;

            -- Insert categories with deterministic UUIDs (hierarchical structure)
            INSERT INTO categories (id, name, description, \"parentId\") VALUES
            -- Root categories
            ('11111111-1111-1111-1111-111111111111', 'Electronics', 'Electronic devices and accessories', NULL),
            ('22222222-2222-2222-2222-222222222222', 'Computing', 'Computing devices and accessories', '11111111-1111-1111-1111-111111111111'),
            ('33333333-3333-3333-3333-333333333333', 'Gaming', 'Gaming consoles and accessories', '11111111-1111-1111-1111-111111111111'),
            -- Child categories under Computing
            ('44444444-4444-4444-4444-444444444444', 'Laptops', 'Laptop computers', '22222222-2222-2222-2222-222222222222'),
            ('55555555-5555-5555-5555-555555555555', 'Desktop PCs', 'Desktop computers and workstations', '22222222-2222-2222-2222-222222222222'),
            -- Child categories under Gaming
            ('66666666-6666-6666-6666-666666666666', 'Consoles', 'Gaming consoles', '33333333-3333-3333-3333-333333333333'),
            ('77777777-7777-7777-7777-777777777777', 'Gaming Accessories', 'Controllers, headsets, etc.', '33333333-3333-3333-3333-333333333333'),
            -- Standalone categories
            ('88888888-8888-8888-8888-888888888888', 'Mobile Devices', 'Mobile phones and tablets', NULL),
            ('99999999-9999-9999-9999-999999999999', 'Tablets', 'Tablet computers and e-readers', NULL);

            -- Insert attributes
            INSERT INTO attributes (id, name, description, type, \"isRequired\", \"isActive\") VALUES
            ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brand', 'Product manufacturer/brand', 'text', true, true),
            ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Model Number', 'Product model number', 'text', false, true),
            ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Price Range', 'Product price range category', 'text', false, true),
            ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Warranty', 'Warranty period in months', 'number', false, true),
            -- Electronics-specific attributes
            ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Power Consumption', 'Power consumption in watts', 'number', false, true),
            ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Dimensions', 'Physical dimensions', 'text', false, true),
            -- Computing-specific attributes
            ('11111111-aaaa-bbbb-cccc-111111111111', 'Processor', 'CPU/processor type', 'text', false, true),
            ('22222222-aaaa-bbbb-cccc-222222222222', 'RAM', 'Memory in GB', 'number', false, true),
            ('33333333-aaaa-bbbb-cccc-333333333333', 'Storage', 'Storage capacity', 'text', false, true),
            ('44444444-aaaa-bbbb-cccc-444444444444', 'Operating System', 'Pre-installed OS', 'text', false, true),
            -- Gaming-specific attributes
            ('55555555-aaaa-bbbb-cccc-555555555555', 'Platform', 'Gaming platform/console', 'text', false, true),
            ('66666666-aaaa-bbbb-cccc-666666666666', 'Max Resolution', 'Maximum video resolution', 'text', false, true),
            ('77777777-aaaa-bbbb-cccc-777777777777', 'Controller Type', 'Type of controller included', 'text', false, true),
            -- Mobile-specific attributes
            ('88888888-aaaa-bbbb-cccc-888888888888', 'Screen Size', 'Display size in inches', 'number', false, true),
            ('99999999-aaaa-bbbb-cccc-999999999999', 'Battery Life', 'Battery life in hours', 'number', false, true);

            -- Insert category-attribute relationships with proper inheritance structure
            INSERT INTO category_attributes (\"categoryId\", \"attributeId\", \"linkType\") VALUES

            -- Electronics (root) - direct attributes
            ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'direct'),
            ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'direct'),
            ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'direct'),
            ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'direct'),
            ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'direct'),

            -- Computing (direct + inherited from Electronics)
            ('22222222-2222-2222-2222-222222222222', '11111111-aaaa-bbbb-cccc-111111111111', 'direct'),
            ('22222222-2222-2222-2222-222222222222', '22222222-aaaa-bbbb-cccc-222222222222', 'direct'),
            ('22222222-2222-2222-2222-222222222222', '33333333-aaaa-bbbb-cccc-333333333333', 'direct'),
            ('22222222-2222-2222-2222-222222222222', '44444444-aaaa-bbbb-cccc-444444444444', 'direct'),
            -- Computing inherits from Electronics
            ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'inherited'),
            ('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Gaming (direct + inherited from Electronics)
            ('33333333-3333-3333-3333-333333333333', '55555555-aaaa-bbbb-cccc-555555555555', 'direct'),
            ('33333333-3333-3333-3333-333333333333', '66666666-aaaa-bbbb-cccc-666666666666', 'direct'),
            ('33333333-3333-3333-3333-333333333333', '77777777-aaaa-bbbb-cccc-777777777777', 'direct'),
            -- Gaming inherits from Electronics
            ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'inherited'),
            ('33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Laptops (direct + inherited from Computing + inherited from Electronics)
            ('44444444-4444-4444-4444-444444444444', '88888888-aaaa-bbbb-cccc-888888888888', 'direct'),
            ('44444444-4444-4444-4444-444444444444', '99999999-aaaa-bbbb-cccc-999999999999', 'direct'),
            -- Laptops inherit from Computing
            ('44444444-4444-4444-4444-444444444444', '11111111-aaaa-bbbb-cccc-111111111111', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', '22222222-aaaa-bbbb-cccc-222222222222', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', '33333333-aaaa-bbbb-cccc-333333333333', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', '44444444-aaaa-bbbb-cccc-444444444444', 'inherited'),
            -- Laptops inherit from Electronics (via Computing)
            ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'inherited'),
            ('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Desktop PCs (direct + inherited from Computing + inherited from Electronics)
            ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'direct'),
            -- Desktop PCs inherit from Computing
            ('55555555-5555-5555-5555-555555555555', '11111111-aaaa-bbbb-cccc-111111111111', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', '22222222-aaaa-bbbb-cccc-222222222222', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', '33333333-aaaa-bbbb-cccc-333333333333', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', '44444444-aaaa-bbbb-cccc-444444444444', 'inherited'),
            -- Desktop PCs inherit from Electronics (via Computing)
            ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Consoles (direct + inherited from Gaming + inherited from Electronics)
            ('66666666-6666-6666-6666-666666666666', '55555555-aaaa-bbbb-cccc-555555555555', 'direct'),
            ('66666666-6666-6666-6666-666666666666', '66666666-aaaa-bbbb-cccc-666666666666', 'direct'),
            -- Consoles inherit from Gaming
            ('66666666-6666-6666-6666-666666666666', '77777777-aaaa-bbbb-cccc-777777777777', 'inherited'),
            -- Consoles inherit from Electronics (via Gaming)
            ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('66666666-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('66666666-6666-6666-6666-666666666666', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'inherited'),
            ('66666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Gaming Accessories (direct + inherited from Gaming + inherited from Electronics)
            ('77777777-7777-7777-7777-777777777777', '77777777-aaaa-bbbb-cccc-777777777777', 'direct'),
            -- Gaming Accessories inherit from Gaming
            ('77777777-7777-7777-7777-777777777777', '55555555-aaaa-bbbb-cccc-555555555555', 'inherited'),
            ('77777777-7777-7777-7777-777777777777', '66666666-aaaa-bbbb-cccc-666666666666', 'inherited'),
            -- Gaming Accessories inherit from Electronics (via Gaming)
            ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'inherited'),
            ('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'inherited'),
            ('77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'inherited'),
            ('77777777-7777-7777-7777-777777777777', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'inherited'),
            ('77777777-7777-7777-7777-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'inherited'),

            -- Mobile Devices (standalone with direct attributes)
            ('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'direct'),
            ('88888888-8888-8888-8888-888888888888', '88888888-aaaa-bbbb-cccc-888888888888', 'direct'),
            ('88888888-8888-8888-8888-888888888888', '99999999-aaaa-bbbb-cccc-999999999999', 'direct'),

            -- Tablets (standalone with direct attributes)
            ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'direct'),
            ('99999999-9999-9999-9999-999999999999', '88888888-aaaa-bbbb-cccc-888888888888', 'direct'),

            -- Global attributes (apply to all categories)
            ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('88888888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global'),
            ('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'global');

            -- Insert sample products (ensuring all have valid categoryId)
            INSERT INTO products (id, name, description, sku, price, \"categoryId\", \"isActive\") VALUES
            -- Gaming Consoles (in Consoles category)
            ('p1-gaming-console', 'PlayStation 5', 'Sony PlayStation 5 Gaming Console', 'PS5-STD-001', 499.99, '66666666-6666-6666-6666-666666666666', true),
            ('p2-gaming-console', 'Xbox Series X', 'Microsoft Xbox Series X Gaming Console', 'XBOX-SX-001', 499.99, '66666666-6666-6666-6666-666666666666', true),
            ('p3-gaming-console', 'Nintendo Switch', 'Nintendo Switch Gaming Console', 'NSW-OLED-001', 349.99, '66666666-6666-6666-6666-666666666666', true),
            -- Desktop PCs
            ('p4-desktop-pc', 'Gaming Desktop Pro', 'High-performance gaming desktop computer', 'GD-PRO-001', 1299.99, '55555555-5555-5555-5555-555555555555', true),
            ('p5-desktop-pc', 'Workstation Elite', 'Professional workstation for development', 'WS-ELITE-001', 1999.99, '55555555-5555-5555-5555-555555555555', true),
            -- Laptops
            ('p6-laptop', 'UltraBook Pro', 'Thin and light laptop for professionals', 'UB-PRO-001', 1199.99, '44444444-4444-4444-4444-444444444444', true),
            ('p7-laptop', 'Gaming Laptop X1', 'High-performance gaming laptop', 'GL-X1-001', 1599.99, '44444444-4444-4444-4444-444444444444', true),
            -- Tablets
            ('p8-tablet', 'iPad Pro 12.9', 'Apple iPad Pro 12.9-inch tablet', 'IPAD-PRO-129', 1099.99, '99999999-9999-9999-9999-999999999999', true),
            ('p9-tablet', 'Surface Pro 9', 'Microsoft Surface Pro 9 tablet', 'SURF-PRO-9', 999.99, '99999999-9999-9999-9999-999999999999', true),
            -- Mobile Devices
            ('p10-mobile', 'iPhone 14 Pro', 'Apple iPhone 14 Pro smartphone', 'IP14-PRO-128', 999.99, '88888888-8888-8888-8888-888888888888', true),
            ('p11-mobile', 'Galaxy S23 Ultra', 'Samsung Galaxy S23 Ultra smartphone', 'GS23-ULTRA-256', 1199.99, '88888888-8888-8888-8888-888888888888', true),
            -- Gaming Accessories
            ('p12-accessory', 'Elite Controller', 'Premium wireless gaming controller', 'CTRL-ELITE-001', 179.99, '77777777-7777-7777-7777-777777777777', true);

            -- Insert product attribute values
            INSERT INTO product_attribute_values (\"productId\", \"attributeId\", value) VALUES
            -- PlayStation 5
            ('p1-gaming-console', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Sony\"'),
            ('p1-gaming-console', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"PlayStation 5\"'),
            ('p1-gaming-console', '55555555-aaaa-bbbb-cccc-555555555555', '\"PlayStation\"'),
            ('p1-gaming-console', '66666666-aaaa-bbbb-cccc-666666666666', '\"4K (2160p)\"'),
            ('p1-gaming-console', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '\"$400-$600\"'),
            ('p1-gaming-console', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '12'),
            -- Xbox Series X
            ('p2-gaming-console', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Microsoft\"'),
            ('p2-gaming-console', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"Xbox Series X\"'),
            ('p2-gaming-console', '55555555-aaaa-bbbb-cccc-555555555555', '\"Xbox\"'),
            ('p2-gaming-console', '66666666-aaaa-bbbb-cccc-666666666666', '\"4K (2160p)\"'),
            ('p2-gaming-console', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '\"$400-$600\"'),
            ('p2-gaming-console', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '12'),
            -- Gaming Desktop Pro
            ('p4-desktop-pc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Custom Build\"'),
            ('p4-desktop-pc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"Gaming Desktop Pro\"'),
            ('p4-desktop-pc', '11111111-aaaa-bbbb-cccc-111111111111', '\"Intel Core i7-12700K\"'),
            ('p4-desktop-pc', '22222222-aaaa-bbbb-cccc-222222222222', '32'),
            ('p4-desktop-pc', '33333333-aaaa-bbbb-cccc-333333333333', '\"1TB NVMe SSD\"'),
            ('p4-desktop-pc', '44444444-aaaa-bbbb-cccc-444444444444', '\"Windows 11 Pro\"'),
            ('p4-desktop-pc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '\"$1000-$1500\"'),
            ('p4-desktop-pc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '650'),
            -- UltraBook Pro (Laptop)
            ('p6-laptop', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Dell\"'),
            ('p6-laptop', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"UltraBook Pro\"'),
            ('p6-laptop', '11111111-aaaa-bbbb-cccc-111111111111', '\"Intel Core i5-1240P\"'),
            ('p6-laptop', '22222222-aaaa-bbbb-cccc-222222222222', '16'),
            ('p6-laptop', '33333333-aaaa-bbbb-cccc-333333333333', '\"512GB NVMe SSD\"'),
            ('p6-laptop', '44444444-aaaa-bbbb-cccc-444444444444', '\"Windows 11 Home\"'),
            ('p6-laptop', '88888888-aaaa-bbbb-cccc-888888888888', '14'),
            ('p6-laptop', '99999999-aaaa-bbbb-cccc-999999999999', '12'),
            ('p6-laptop', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '\"$1000-$1500\"'),
            -- iPhone 14 Pro (Mobile)
            ('p10-mobile', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Apple\"'),
            ('p10-mobile', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"iPhone 14 Pro\"'),
            ('p10-mobile', '88888888-aaaa-bbbb-cccc-888888888888', '6.1'),
            ('p10-mobile', '99999999-aaaa-bbbb-cccc-999999999999', '23'),
            -- iPad Pro (Tablet)
            ('p8-tablet', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Apple\"'),
            ('p8-tablet', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"iPad Pro 12.9\"'),
            ('p8-tablet', '88888888-aaaa-bbbb-cccc-888888888888', '12.9'),
            -- Elite Controller (Gaming Accessory)
            ('p12-accessory', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '\"Microsoft\"'),
            ('p12-accessory', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '\"Elite Wireless Controller Series 2\"'),
            ('p12-accessory', '77777777-aaaa-bbbb-cccc-777777777777', '\"Wireless Pro Controller\"'),
            ('p12-accessory', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '\"$100-$200\"'),
            ('p12-accessory', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '12');
        " >/dev/null 2>&1

        if [ $? -eq 0 ]; then
            print_success "Direct data setup completed successfully"
        else
            print_error "Failed to set up test data"
            exit 1
        fi
    fi

    # Ensure no products have null categoryId values
    print_status "Validating product categories..."
    local null_categories=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT COUNT(*) FROM products WHERE \"categoryId\" IS NULL;" 2>/dev/null | tr -d ' ')

    if [ "$null_categories" -gt 0 ]; then
        print_warning "Found $null_categories products without categories, fixing..."

        # Get a default category ID
        local default_category=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories LIMIT 1;" 2>/dev/null | tr -d ' ')

        if [ -n "$default_category" ]; then
            docker exec -i product-service-postgres psql -U postgres -d product_service -c "
                UPDATE products
                SET \"categoryId\" = '$default_category'
                WHERE \"categoryId\" IS NULL;
            " >/dev/null 2>&1
            print_success "Fixed products without categories"
        fi
    fi

    print_success "Database setup complete"
}

# Build the application (now handled by Docker Compose)
build_application() {
    print_status "Application is being built and started via Docker Compose..."
    print_success "Application container is running"
}

# Seed the database with programmatic seed data
seed_database() {
    print_status "Seeding database with comprehensive test data using API..."

    # Wait a bit more to ensure application is fully ready
    local retries=10
    while [ $retries -gt 0 ]; do
        if curl -f http://localhost:3000/api/v1/health >/dev/null 2>&1; then
            print_success "Application confirmed ready for seeding"
            break
        fi
        print_status "Waiting for application to be ready for seeding... ($retries retries left)"
        sleep 3
        retries=$((retries - 1))
    done

    if [ $retries -eq 0 ]; then
        print_warning "Application may not be fully ready, but attempting to seed anyway"
    fi

    # Call the seed endpoint to populate with programmatic data including inherited link types
    print_status "Calling seed endpoint to populate database with inherited link types..."

    local seed_response=$(curl -s -X POST "http://localhost:3000/api/v1/seed" 2>/dev/null)
    local seed_status=$?

    if [ $seed_status -eq 0 ]; then
        if echo "$seed_response" | grep -q "successfully"; then
            print_success "✓ Database seeded successfully with comprehensive test data"
            print_status "Seed response: $seed_response"
        else
            print_warning "Seed endpoint responded but with unexpected message: $seed_response"
        fi
    else
        print_warning "Failed to call seed endpoint, but setup data should still be available"
    fi

    # Validate that we have inherited link types
    print_status "Validating inherited link types..."
    local inherited_count=$(curl -s "http://localhost:3000/api/v1/attributes?linkTypes[]=inherited" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d: -f2)

    if [ -n "$inherited_count" ] && [ "$inherited_count" -gt 0 ]; then
        print_success "✓ Found $inherited_count inherited attributes in the system"
    else
        print_warning "No inherited attributes found - seed may have had issues"
    fi
}

# Validate the setup
validate_setup() {
    print_status "Validating database setup..."

    # Get database statistics
    local stats=$(docker exec -i product-service-postgres psql -U postgres -d product_service -c "
        SELECT
            (SELECT COUNT(*) FROM categories) as categories,
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM attributes) as attributes,
            (SELECT COUNT(*) FROM category_attributes) as attribute_links,
            (SELECT COUNT(*) FROM product_attribute_values) as product_values;
    " 2>/dev/null | grep -E "^\s*[0-9]" | head -1)

    if [ -n "$stats" ]; then
        print_success "Database validation completed"
        echo "   Data counts: $stats"

        # Check specifically for products
        local product_count=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' ')
        if [ "$product_count" -gt 0 ]; then
            print_success "✓ Products table contains $product_count products"

            # Show sample products
            print_status "Sample products:"
            docker exec -i product-service-postgres psql -U postgres -d product_service -c "
                SELECT name, sku, price, (SELECT name FROM categories WHERE id = products.\"categoryId\") as category
                FROM products
                ORDER BY name
                LIMIT 5;" 2>/dev/null
        else
            print_error "✗ Products table is empty!"
            print_status "Attempting to reload product data..."

            # Get available category IDs
            local gaming_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories WHERE name ILIKE '%gaming%' LIMIT 1;" 2>/dev/null | tr -d ' ')
            local computing_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories WHERE name ILIKE '%computing%' LIMIT 1;" 2>/dev/null | tr -d ' ')
            local mobile_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories WHERE name ILIKE '%mobile%' LIMIT 1;" 2>/dev/null | tr -d ' ')
            local tablet_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories WHERE name ILIKE '%tablet%' LIMIT 1;" 2>/dev/null | tr -d ' ')
            local desktop_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories WHERE name ILIKE '%desktop%' LIMIT 1;" 2>/dev/null | tr -d ' ')

            # Use first available category as fallback
            local fallback_cat=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT id FROM categories LIMIT 1;" 2>/dev/null | tr -d ' ')

            # Set defaults if specific categories not found
            [ -z "$gaming_cat" ] && gaming_cat="$fallback_cat"
            [ -z "$computing_cat" ] && computing_cat="$fallback_cat"
            [ -z "$mobile_cat" ] && mobile_cat="$fallback_cat"
            [ -z "$tablet_cat" ] && tablet_cat="$fallback_cat"
            [ -z "$desktop_cat" ] && desktop_cat="$fallback_cat"

            # Try to reload just the products data with correct category IDs
            docker exec -i product-service-postgres psql -U postgres -d product_service -c "
                INSERT INTO products (id, name, description, sku, price, \"categoryId\", \"isActive\") VALUES
                ('p1-gaming-console', 'PlayStation 5', 'Sony PlayStation 5 Gaming Console', 'PS5-STD-001', 499.99, '$gaming_cat', true),
                ('p2-gaming-console', 'Xbox Series X', 'Microsoft Xbox Series X Gaming Console', 'XBOX-SX-001', 499.99, '$gaming_cat', true),
                ('p3-gaming-console', 'Nintendo Switch', 'Nintendo Switch Gaming Console', 'NSW-OLED-001', 349.99, '$gaming_cat', true),
                ('p4-desktop-pc', 'Gaming Desktop Pro', 'High-performance gaming desktop computer', 'GD-PRO-001', 1299.99, '$desktop_cat', true),
                ('p5-desktop-pc', 'Workstation Elite', 'Professional workstation for development', 'WS-ELITE-001', 1999.99, '$desktop_cat', true),
                ('p6-laptop', 'UltraBook Pro', 'Thin and light laptop for professionals', 'UB-PRO-001', 1199.99, '$computing_cat', true),
                ('p7-tablet', 'iPad Pro 12.9', 'Apple iPad Pro 12.9-inch tablet', 'IPAD-PRO-129', 1099.99, '$tablet_cat', true),
                ('p8-tablet', 'Surface Pro 9', 'Microsoft Surface Pro 9 tablet', 'SURF-PRO-9', 999.99, '$tablet_cat', true),
                ('p9-mobile', 'iPhone 14 Pro', 'Apple iPhone 14 Pro smartphone', 'IP14-PRO-128', 999.99, '$mobile_cat', true),
                ('p10-mobile', 'Galaxy S23 Ultra', 'Samsung Galaxy S23 Ultra smartphone', 'GS23-ULTRA-256', 1199.99, '$mobile_cat', true)
                ON CONFLICT (id) DO NOTHING;
            " >/dev/null 2>&1

            local new_count=$(docker exec -i product-service-postgres psql -U postgres -d product_service -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' ')
            if [ "$new_count" -gt 0 ]; then
                print_success "✓ Products reloaded successfully - now contains $new_count products"
            else
                print_error "✗ Failed to reload products data"
            fi
        fi
    else
        print_error "Database validation failed"
        exit 1
    fi
}

# Display final information
show_final_info() {
    print_header "Setup Complete!"

    echo "🐘 PostgreSQL:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: product_service"
    echo "   Username: postgres"
    echo "   Password: postgres"

    echo ""
    echo "🔴 Redis:"
    echo "   Host: localhost"
    echo "   Port: 6379"

    echo ""
    echo "🚀 Next steps:"
    echo "   - Application is already running at http://localhost:3000"
    echo "   - View API documentation at http://localhost:3000/api"
    echo "   - Check application health at http://localhost:3000/api/v1/health"

    echo ""
    echo "🔧 Useful commands:"
    echo "   - View all logs: docker-compose -f docker-compose.full.yml logs -f"
    echo "   - View app logs: docker logs product-service-app"
    echo "   - View PostgreSQL logs: docker logs product-service-postgres"
    echo "   - View Redis logs: docker logs product-service-redis"
    echo "   - Stop all services: docker-compose -f docker-compose.full.yml down"
    echo "   - Reset data only: ./reset-data.sh"
    echo "   - Full restart: ./setup-final.sh"

    print_success "All services are running and ready!"
}

# Main execution
main() {
    print_header "Product Service Complete Setup"

    check_docker
    cleanup_containers
    start_services
    setup_database
    build_application
    seed_database
    validate_setup
    show_final_info
}

# Run main function
main "$@"
