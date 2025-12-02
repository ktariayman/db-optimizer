#!/usr/bin/env bash
set -e

MODE=$1
shift

IMPORT_TYPE="raw"
INDEX_FLAG="noindex"
REPLICA="false"

# Parse flags
for arg in "$@"; do
  case "$arg" in
    --schema) IMPORT_TYPE="schema" ;;
    --index) INDEX_FLAG="index" ;;
    --replica) REPLICA="true" ;;
  esac
done


# -----------------------------
# Resolve COMPOSE file
# -----------------------------
COMPOSE_FILE="ops/docker-compose.${MODE}.yml"
if [ "$REPLICA" == "true" ]; then
  COMPOSE_FILE="ops/docker-compose.replica.yml"
fi

COMPOSE="docker compose -f $COMPOSE_FILE"

echo "MODE       = $MODE"
echo "IMPORT     = $IMPORT_TYPE"
echo "INDEX      = $INDEX_FLAG"
echo "REPLICA    = $REPLICA"
echo "COMPOSE    = $COMPOSE_FILE"
echo ""


# -----------------------------
# Reset environment
# -----------------------------
echo "➡ Resetting environment..."
$COMPOSE down -v
$COMPOSE up -d --build

sleep 5


# -----------------------------
# Import data
# -----------------------------
echo "➡ Importing data..."

if [[ "$INDEX_FLAG" == "index" ]]; then
  export IMPORT_CREATE_INDEX=true
else
  export IMPORT_CREATE_INDEX=false
fi

if [[ "$IMPORT_TYPE" == "schema" ]]; then
  $COMPOSE run --rm importer npm run import:schema
else
  $COMPOSE run --rm importer npm run import:raw
fi


# -----------------------------
# Run benchmark
# -----------------------------
FILENAME="$MODE"

# Compose filename based on flags
[ "$IMPORT_TYPE" == "schema" ] && FILENAME="${FILENAME}-schema"
[ "$IMPORT_TYPE" == "raw" ] && FILENAME="${FILENAME}"
[ "$INDEX_FLAG" == "index" ] && FILENAME="${FILENAME}-index"
[ "$REPLICA" == "true" ] && FILENAME="${FILENAME}-replica"

FILENAME="${FILENAME}.json"

echo "➡ Benchmark → saving to: $FILENAME"

export MSYS_NO_PATHCONV=1

$COMPOSE run --rm --entrypoint k6 \
  -e K6_SUMMARY_EXPORT="/workload/reports/$FILENAME" \
  -v "$PWD/workload:/workload" \
  k6 run /workload/read_write.js

echo "✅ Completed: $FILENAME"
