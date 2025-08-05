# PostgreSQL Volume Configuration

This directory contains PostgreSQL database setup and initialization files.

## Directory Structure
- `init/` - SQL scripts run during database initialization
- `backups/` - Database backup files

## Database Setup
The database will be automatically initialized with the scripts in the `init/` directory when the container starts for the first time.

## Backup and Restore
Use the provided scripts in `../scripts/` to backup and restore the database.