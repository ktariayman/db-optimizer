#!/usr/bin/env bash
set -e

MODE=${2:-baseline} # Default to baseline if not specified
COMPOSE_FILE="ops/docker-compose.baseline.yml"

if [ "$MODE" == "constrained" ]; then
  COMPOSE_FILE="ops/docker-compose.constrained.yml"
elif [ "$MODE" == "replica" ]; then
  COMPOSE_FILE="ops/docker-compose.replica.yml"
fi

COMPOSE="docker compose -f $COMPOSE_FILE"

echo "Using Compose File: $COMPOSE_FILE"

case "$1" in
  up)        $COMPOSE up -d --build ;;
  down)      $COMPOSE down -v ;;
  logs)      $COMPOSE logs -f api ;;
  import)    $COMPOSE run --rm importer npm run import:rr ;;
  baseline)
    export MSYS_NO_PATHCONV=1
    $COMPOSE run --rm --entrypoint k6 \
      -e K6_SUMMARY_EXPORT=/workload/reports/${MODE}.json \
      -v "$PWD/workload:/workload" \
      k6 run /workload/read_write.js
    ;;
  index)
    # Handle indexing for replica set vs standalone
    if [ "$MODE" == "replica" ]; then
       $COMPOSE exec -T mongo1 mongosh --quiet --eval 'db.getSiblingDB("app").recipes.createIndex({ recipe_title: "text", ingredients: "text" })'
    else
       $COMPOSE exec -T mongo mongosh "mongodb://root:root@mongo:27017/app?authSource=admin" --eval 'db.recipes.createIndex({ recipe_title: "text", ingredients: "text" })'
    fi
    ;;
  health)    curl -s http://localhost:8080/health || true ;;
  compare)   node workload/compare.js ;;
  reset)     $COMPOSE down -v && $COMPOSE up -d --build ;;
  reset-db)
    # Drops the 'app' database but keeps containers running
    if [ "$MODE" == "replica" ]; then
       $COMPOSE exec -T mongo1 mongosh --quiet --eval 'db.getSiblingDB("app").dropDatabase()'
    else
       $COMPOSE exec -T mongo mongosh "mongodb://root:root@mongo:27017/app?authSource=admin" --quiet --eval 'db.dropDatabase()'
    fi
    echo "Database 'app' dropped."
    ;;
  *)
    echo "Usage: $0 {up|down|logs|import|baseline|index|health} [mode]"
    echo "Modes: baseline (default), constrained, replica"
    echo "Example: ./dev.sh up constrained"
    exit 1;;
esac
