#!/bin/bash

# Script to stop the database and dependencies

echo "🛑 Stopping services..."
docker-compose -f docker-compose.dev.yml down

if [ $? -eq 0 ]; then
    echo "✅ Services stopped successfully!"
else
    echo "❌ Failed to stop some services. You may need to check Docker manually."
fi
