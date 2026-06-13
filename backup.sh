#!/bin/bash

# Create backup directory if it doesn't exist
BACKUP_DIR="_BACKUP"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for the filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="webmonitor-$TIMESTAMP.zip"

echo "📦 Creating backup: $FILENAME..."

# Zip everything except .claude, _BACKUP, and node_modules folders
zip -r "$BACKUP_DIR/$FILENAME" . -x ".claude/*" "_BACKUP/*" "node_modules/*" ".*/.claude/*" ".*/_BACKUP/*" ".*/node_modules/*"

if [ $? -eq 0 ]; then
    echo "✅ Backup successfully created at $BACKUP_DIR/$FILENAME"
else
    echo "❌ Backup failed!"
    exit 1
fi
