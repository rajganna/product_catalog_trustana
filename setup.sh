#!/bin/bash

# Product Service Complete Setup Script
# This script brings up all services and sets up the comprehensive test dataset

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
    docker stop product-service-postgres-1 2>/dev/null || true
    docker rm product-service-postgres-1 2>/dev/null || true
    docker stop product-service-redis-1 2>/dev/null || true
    docker rm product-service-redis-1 2>/dev/null || true
    print_success "Cleanup complete"
}

# Start all services
start_services() {
    print_status "Starting database services..."

    # Start only the database services we need
    docker run -d --name product-service-postgres-1 \
        -e POSTGRES_DB=product_service \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -p 5432:5432 \
        postgres:15 2>/dev/null || true

    docker run -d --name product-service-redis-1 \
        -p 6379:6379 \
        redis:7-alpine 2>/dev/null || true

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 5

    # Check PostgreSQL
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker exec product-service-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
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
    if docker exec product-service-redis-1 redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_warning "Redis may not be ready, but continuing..."
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."

    # Check if migrations table exists, if not create it
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service -c "
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL,
            UNIQUE(timestamp)
        );
    " >/dev/null 2>&1

    print_success "Database migrations table ready"
}

# Apply schema migrations
apply_schema() {
    print_status "Applying schema migrations..."

    # Apply search optimization schema
    if docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/apply-search-migrations.sql; then
        print_success "Search optimization schema applied"
    else
        print_error "Failed to apply search optimization schema"
        exit 1
    fi

    # Create materialized views
    if docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/create-materialized-views.sql; then
        print_success "Materialized views created"
    else
        print_error "Failed to create materialized views"
        exit 1
    fi
}

# Set up comprehensive test data
setup_test_data() {
    print_status "Setting up comprehensive test dataset..."

    if docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/setup-comprehensive-test-data.sql; then
        print_success "Comprehensive test dataset created"
    else
        print_error "Failed to create test dataset"
        exit 1
    fi
}

# Validate the setup
validate_setup() {
    print_status "Validating database setup..."

    # Run validation and capture output
    validation_output=$(docker exec -i product-service-postgres-1 psql -U postgres -d product_service < migrations/sql-scripts/validate-comprehensive-dataset.sql 2>/dev/null)

    if [ $? -eq 0 ]; then
        print_success "Database validation completed successfully"

        # Extract and display key metrics
        echo "$validation_output" | grep -E "(categories|products|attributes|links)" | tail -5
    else
        print_error "Database validation failed"
        exit 1
    fi
}

# Build and start the application
start_application() {
    print_status "Building and starting the application..."

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi

    # Build the application
    print_status "Building TypeScript application..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi

    print_warning "Application is ready. Use 'npm run start' to run the server."
}

# Display service information
show_service_info() {
    print_header "Service Information"

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
    echo "📊 Database Statistics:"
    docker exec -i product-service-postgres-1 psql -U postgres -d product_service -c "
        SELECT
            (SELECT COUNT(*) FROM categories) as categories,
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM attributes) as attributes,
            (SELECT COUNT(*) FROM category_attributes) as attribute_links,
            (SELECT COUNT(*) FROM product_attribute_values) as product_attribute_values;
    " 2>/dev/null | grep -E "^\s*[0-9]" | head -1
}

# Main execution
main() {
    print_header "Product Service Complete Setup"

    # Pre-flight checks
    check_docker

    # Setup process
    cleanup_containers
    start_services
    run_migrations
    apply_schema
    setup_test_data
    validate_setup
    start_application

    # Final information
    show_service_info

    print_header "Setup Complete!"
    print_success "All services are running and the database is populated with test data."
    print_success "You can now use the product service API."

    echo ""
    echo "🚀 Next steps:"
    echo "   - Run 'npm run start' to start the application server"
    echo "   - Access the API at http://localhost:3000"
    echo "   - View API documentation at http://localhost:3000/api"
    echo ""
    echo "🔧 Useful commands:"
    echo "   - View PostgreSQL logs: docker logs product-service-postgres-1"
    echo "   - View Redis logs: docker logs product-service-redis-1"
    echo "   - Stop services: docker stop product-service-postgres-1 product-service-redis-1"
    echo "   - Restart services: ./setup.sh"
    echo ""
}

# Run main function
main "$@"
