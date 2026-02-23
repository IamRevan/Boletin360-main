#!/bin/bash

# Path to the backup script
BACKUP_SCRIPT="/home/ben/Coding Projects/Uni/Boletin360-main/scripts/backup-db.sh"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Ensure the script is executable
chmod +x "$BACKUP_SCRIPT"

# Add to crontab if not already present (Daily at 2:00 AM)
CRON_JOB="0 2 * * * $BACKUP_SCRIPT"

(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_JOB") | crontab -

echo "Backup cron job successfully configured for daily execution at 02:00 AM."
echo "Current crontab:"
crontab -l
