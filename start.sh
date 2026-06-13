#!/bin/bash

echo "🚀 Starting System Monitor..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Kill any process using port 3000 to avoid EADDRINUSE
echo "🧹 Cleaning up port 3000..."
fuser -k 3000/tcp || true

# Start the application natively
echo "🚀 Starting System Monitor natively..."
npm start
