#!/bin/bash
echo "🗑️ Uninstalling WebMonitor service..."

sudo systemctl stop webmonitor
sudo systemctl disable webmonitor
sudo rm /etc/systemd/system/webmonitor.service
sudo systemctl daemon-reload

echo "✅ Service uninstalled successfully."
