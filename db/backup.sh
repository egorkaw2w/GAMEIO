# db/backup.sh
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
docker exec postgres-db pg_dump -U postgres game_store > $BACKUP_DIR/backup_$TIMESTAMP.sql
echo "Backup saved: $BACKUP_DIR/backup_$TIMESTAMP.sql"