#!/bin/bash
echo "🛠️ Installing WebMonitor as a system service..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/webmonitor.service"
SYSTEMD_PATH="/etc/systemd/system/webmonitor.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ Error: $SERVICE_FILE not found!"
    exit 1
fi

# Update the service file with the current working directory and user
echo "📝 Updating service file paths..."
CURRENT_USER=$USER
sed -e "s|WorkingDirectory=.*|WorkingDirectory=$SCRIPT_DIR|" \
    -e "s|User=.*|User=$CURRENT_USER|" \
    "$SERVICE_FILE" > /tmp/webmonitor.service.tmp

# Update the service file with the current working directory and user
echo "📝 Updating service file paths..."
CURRENT_USER=$USER
sed -e "s|WorkingDirectory=.*|WorkingDirectory=$SCRIPT_DIR|" \
    -e "s|User=.*|User=$CURRENT_USER|" \
    "$SERVICE_FILE" > /tmp/webmonitor.service.tmp

echo "📋 Copying service file to /etc/systemd/system/..."
sudo cp /tmp/webmonitor.service.tmp "$SYSTEMD_PATH"
rm /tmp/webmonitor.service.tmp

echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "⚙️ Enabling service to start at boot..."
sudo systemctl enable webmonitor

echo "🚀 Starting service..."
sudo systemctl start webmonitor

echo ""
echo "✅ Service installed and started successfully!"
echo "🌐 Access the dashboard at: http://localhost:3000"
echo "📋 Check status: systemctl status webmonitor"
echo "📋 View logs: journalctl -u webmonitor -f"
