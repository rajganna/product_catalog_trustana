#!/bin/bash

# Quick Start Script for Dockerized Product Service
# This script provides quick commands for common Docker operations

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    echo "Product Service Docker Commands"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services (build if needed)"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  rebuild   - Force rebuild and start"
    echo "  logs      - Show logs for all services"
    echo "  logs-app  - Show logs for application only"
    echo "  logs-db   - Show logs for database only"
    echo "  status    - Show status of all containers"
    echo "  shell     - Open shell in application container"
    echo "  db-shell  - Open PostgreSQL shell"
    echo "  clean     - Stop and remove all containers and volumes"
    echo "  setup     - Full setup with database initialization"
    echo "  reset     - Reset database data only"
    echo ""
}

start_services() {
    print_info "Starting all services..."
    docker-compose -f docker-compose.full.yml up -d
    print_success "Services started. Application available at http://localhost:3000"
}

stop_services() {
    print_info "Stopping all services..."
    docker-compose -f docker-compose.full.yml down
    print_success "Services stopped"
}

restart_services() {
    print_info "Restarting all services..."
    docker-compose -f docker-compose.full.yml restart
    print_success "Services restarted"
}

rebuild_services() {
    print_info "Rebuilding and starting all services..."
    docker-compose -f docker-compose.full.yml up -d --build --force-recreate
    print_success "Services rebuilt and started"
}

show_logs() {
    print_info "Showing logs for all services..."
    docker-compose -f docker-compose.full.yml logs -f
}

show_app_logs() {
    print_info "Showing application logs..."
    docker logs -f product-service-app 2>/dev/null || echo "Application container not running"
}

show_db_logs() {
    print_info "Showing database logs..."
    docker logs -f product-service-postgres 2>/dev/null || echo "Database container not running"
}

show_status() {
    print_info "Container status:"
    docker-compose -f docker-compose.full.yml ps
    echo ""
    print_info "Service health:"
    curl -s http://localhost:3000/api/v1/health 2>/dev/null && echo "✅ Application: Healthy" || echo "❌ Application: Not responding"
    docker exec product-service-postgres pg_isready -U postgres 2>/dev/null && echo "✅ PostgreSQL: Ready" || echo "❌ PostgreSQL: Not ready"
    docker exec product-service-redis redis-cli ping 2>/dev/null >/dev/null && echo "✅ Redis: Ready" || echo "❌ Redis: Not ready"
}

open_shell() {
    print_info "Opening shell in application container..."
    docker exec -it product-service-app /bin/sh 2>/dev/null || echo "Application container not running"
}

open_db_shell() {
    print_info "Opening PostgreSQL shell..."
    docker exec -it product-service-postgres psql -U postgres -d product_service 2>/dev/null || echo "Database container not running"
}

clean_all() {
    print_warning "This will stop and remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up all containers and volumes..."
        docker-compose -f docker-compose.full.yml down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

full_setup() {
    print_info "Running full setup..."
    ./setup-final.sh
}

reset_data() {
    print_info "Resetting database data..."
    ./reset-data.sh
}

# Main command handling
case "${1:-help}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "rebuild")
        rebuild_services
        ;;
    "logs")
        show_logs
        ;;
    "logs-app")
        show_app_logs
        ;;
    "logs-db")
        show_db_logs
        ;;
    "status")
        show_status
        ;;
    "shell")
        open_shell
        ;;
    "db-shell")
        open_db_shell
        ;;
    "clean")
        clean_all
        ;;
    "setup")
        full_setup
        ;;
    "reset")
        reset_data
        ;;
    "help"|*)
        show_help
        ;;
esac
