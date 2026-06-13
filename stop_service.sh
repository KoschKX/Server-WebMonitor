#!/bin/bash
echo "🛑 Stopping WebMonitor service..."
echo ""

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
pkill -f "node server_linux.js" 2>/dev/null || true

echo "✅ Service stopped."
echo ""
