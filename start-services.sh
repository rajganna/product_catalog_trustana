#!/bin/bash

# Script to start the database and dependencies for local development

echo "Starting PostgreSQL and Redis services for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start only the database and redis services from docker-compose
echo "🚀 Starting services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis localstack

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully!"
    echo ""
    echo "📋 Service Information:"
    echo "  - PostgreSQL: localhost:9002"
    echo "  - Redis: localhost:6379"
    echo "  - LocalStack: localhost:4566"
    echo ""
    echo "🚀 You can now run the application with:"
    echo "   npm run start:dev"
    echo ""
    echo "🛑 To stop services later, run:"
    echo "   docker-compose -f docker-compose.dev.yml down"
else
    echo "❌ Failed to start services. Please check Docker configuration."
    exit 1
fi
