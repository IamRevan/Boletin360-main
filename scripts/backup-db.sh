#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/boletin360"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/boletin360_backup.log"

# Load environment variables from app directory if needed
# source /home/ben/Coding\ Projects/Uni/Boletin360-main/server/.env

# Database credentials (should ideally be set in environment or ~/.pgpass)
# Using docker exec if the DB is in a container
DB_CONTAINER="boletin360-db-1"
DB_USER="boletin360"
DB_NAME="boletin360"

echo "[$(date)] Starting backup process..." >> $LOG_FILE

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Run pg_dump inside the container and compress it
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

if sudo docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE; then
    echo "[$(date)] Backup successful: $BACKUP_FILE" >> $LOG_FILE
else
    echo "[$(date)] ERROR: Backup failed!" >> $LOG_FILE
    exit 1
fi

# Cleanup old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Cleanup of backups older than $KEEP_DAYS days completed." >> $LOG_FILE

echo "[$(date)] Process finished." >> $LOG_FILE
