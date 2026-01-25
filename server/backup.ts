/**
 * PostgreSQL Backup Script
 * 
 * Usage: npx ts-node server/backup.ts
 * 
 * Creates a timestamped backup of the database in the backups/ folder.
 * Requires pg_dump to be installed and accessible in PATH.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

// Parse DATABASE_URL
// Format: postgres://user:password@host:port/database
const urlMatch = DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
    console.error('❌ Invalid DATABASE_URL format');
    process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backups directory: ${BACKUP_DIR}`);
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFileName = `backup_${database}_${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFileName);

console.log(`🔄 Starting backup of database: ${database}`);
console.log(`📍 Backup will be saved to: ${backupPath}`);

try {
    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: password };

    // Run pg_dump
    execSync(
        `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f "${backupPath}" --format=plain`,
        { env, stdio: 'inherit' }
    );

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup completed successfully!`);
    console.log(`📦 File size: ${fileSizeMB} MB`);
    console.log(`📍 Location: ${backupPath}`);

    // Clean up old backups (keep last 10)
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .sort()
        .reverse();

    if (backups.length > 10) {
        const toDelete = backups.slice(10);
        toDelete.forEach(file => {
            fs.unlinkSync(path.join(BACKUP_DIR, file));
            console.log(`🗑️ Deleted old backup: ${file}`);
        });
    }

} catch (error) {
    console.error('❌ Backup failed:', error);
    console.error('');
    console.error('Make sure pg_dump is installed and accessible in your PATH.');
    console.error('On Windows, you may need to add PostgreSQL bin folder to your PATH.');
    process.exit(1);
}
