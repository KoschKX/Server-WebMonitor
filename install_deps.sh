#!/bin/bash

echo "🛠️ Installing system dependencies for WebMonitor..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run this script as root (use sudo)"
  exit 1
fi

# Detect OS
if [ -f /etc/fedora-release ] || [ -f /etc/redhat-release ]; then
    echo "Detected Fedora/RHEL"
    dnf install -y lshw util-linux pciutils usbutils procps sysstat
elif [ -f /etc/debian_version ]; then
    echo "Detected Debian/Ubuntu"
    apt-get update
    apt-get install -y lshw util-linux pciutils usbutils procps sysstat
else
    echo "❌ Unsupported OS. Please install lshw, util-linux, pciutils, usbutils, procps, and sysstat manually."
    exit 1
fi

echo ""
echo "✅ System dependencies installed successfully!"
