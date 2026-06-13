#!/bin/bash

echo "🛑 Stopping System Monitor..."
docker compose down

echo ""
echo "✅ System Monitor stopped."
echo ""
echo "To remove all data and images, run:"
echo "   docker compose down --rmi all -v"
