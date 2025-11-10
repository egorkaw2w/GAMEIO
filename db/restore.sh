# db/restore.sh
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql>"
    exit 1
fi
docker exec -i postgres-db psql -U postgres -d game_store < $1
echo "Restored from $1"