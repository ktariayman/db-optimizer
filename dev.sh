#!/usr/bin/env bash
set -e
if [ -z "$1" ]; then
  echo "Error: MODE argument is required."
  echo "Usage: ./dev.sh <baseline|moderate|constrained|unbearable> [--schema] [--index] [--replica]"
  exit 1
fi

MODE=$1
shift # Shift to process flags

# -----------------------------
# Default Configuration
# -----------------------------
IMPORT_TYPE="raw"       # Default to legacy string data import
INDEX_FLAG="noindex"    # Default to no indexing
REPLICA="false"         # Default to standalone instance

# -----------------------------
# Parse Command Line Flags
# -----------------------------
for arg in "$@"; do
  case "$arg" in
    --schema)
      IMPORT_TYPE="schema"
      ;;
    --index)
      INDEX_FLAG="index"
      ;;
    --replica)
      REPLICA="true"
      ;;
    *)
      echo "Unknown flag: $arg"
      exit 1
      ;;
  esac
done

# -----------------------------
# Resolve Docker Compose File
# -----------------------------
# Select the appropriate docker-compose file based on mode or replica flag.
COMPOSE_FILE="ops/docker-compose.${MODE}.yml"

if [ "$REPLICA" == "true" ]; then
  COMPOSE_FILE="ops/docker-compose.replica.yml"
fi

COMPOSE="docker compose -f $COMPOSE_FILE"

echo "========================================"
echo "🚀 Starting Workflow"
echo "========================================"
echo "MODE       : $MODE"
echo "IMPORT     : $IMPORT_TYPE"
echo "INDEX      : $INDEX_FLAG"
echo "REPLICA    : $REPLICA"
echo "COMPOSE    : $COMPOSE_FILE"
echo "========================================"
echo ""


# -----------------------------
# Step 1: Reset Environment
# -----------------------------
echo "➡ [1/3] Resetting environment..."
# Stop containers and remove volumes to ensure a clean slate
$COMPOSE down -v
# Build and start containers in detached mode
$COMPOSE up -d --build
export IMPORT_TYPE
echo "IMPORT_TYPE: $IMPORT_TYPE"

echo "⏳ Waiting for services to initialize..."
sleep 5


# -----------------------------
# Step 2: Import Data
# -----------------------------
echo "➡ [2/3] Importing data..."

# Set environment variable for the importer service to determine indexing
if [[ "$INDEX_FLAG" == "index" ]]; then
  export IMPORT_CREATE_INDEX=true
else
  export IMPORT_CREATE_INDEX=false
fi

# Run the appropriate import script inside the 'importer' container
if [[ "$IMPORT_TYPE" == "schema" ]]; then
  echo "   Running schema-optimized import..."
  $COMPOSE run --rm importer npm run import:schema
else
  echo "   Running raw legacy import..."
  $COMPOSE run --rm importer npm run import:raw
fi


# -----------------------------
# Step 3: Run Benchmark
# -----------------------------
echo "➡ [3/3] Running benchmark..."

# Construct a meaningful filename for the report based on current configuration
FILENAME="$MODE"

[ "$IMPORT_TYPE" == "schema" ] && FILENAME="${FILENAME}-schema"
[ "$IMPORT_TYPE" == "raw" ] && FILENAME="${FILENAME}" # Explicit for clarity
[ "$INDEX_FLAG" == "index" ] && FILENAME="${FILENAME}-index"
[ "$REPLICA" == "true" ] && FILENAME="${FILENAME}-replica"

FILENAME="${FILENAME}.json"

echo "   Target report file: workload/reports/$FILENAME"

# Prevent path conversion issues on Windows (Git Bash/MSYS)
export MSYS_NO_PATHCONV=1

# Run K6 benchmark
# - Mounts the workload directory
# - Exports summary to the reports folder
$COMPOSE run --rm --entrypoint k6 \
  -e K6_SUMMARY_EXPORT="/workload/reports/$FILENAME" \
  -v "$PWD/workload:/workload" \
  k6 run /workload/read_write.js

echo ""
echo "✅ Workflow Completed Successfully!"
echo "📄 Report saved to: workload/reports/$FILENAME"
