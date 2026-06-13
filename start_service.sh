#!/bin/bash
echo "🚀 Starting WebMonitor service..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

echo "Starting service..."
nohup node server_linux.js > /dev/null 2>&1 &

sleep 2
echo ""
echo "✅ WebMonitor service started!"
echo "Access at: http://localhost:3000"
echo ""
