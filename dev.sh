#!/usr/bin/env bash
set -e

MODE=${2:-baseline} # baseline, constrained, or moderate
COMPOSE_FILE="ops/docker-compose.baseline.yml"

if [ "$MODE" == "constrained" ]; then
  COMPOSE_FILE="ops/docker-compose.constrained.yml"
elif [ "$MODE" == "moderate" ]; then
  COMPOSE_FILE="ops/docker-compose.moderate.yml"
elif [ "$MODE" == "replica" ]; then
  COMPOSE_FILE="ops/docker-compose.replica.yml"
fi

COMPOSE="docker compose -f $COMPOSE_FILE"

echo "Using Compose File: $COMPOSE_FILE"

case "$1" in
  up)        $COMPOSE up -d --build ;;
  down)      $COMPOSE down -v ;;
  logs)      $COMPOSE logs -f api ;;
  
  import-raw)
  echo "Import: RAW"

  if [[ "$3" == "--with-index" ]]; then
      export IMPORT_CREATE_INDEX=true
  else
      export IMPORT_CREATE_INDEX=false
  fi

  $COMPOSE run --rm importer npm run import:raw
  ;;
  
  import-schema)
  echo "Import: SCHEMA"

  if [[ "$3" == "--with-index" ]]; then
    export IMPORT_CREATE_INDEX=true
    echo "Indexing ENABLED"
  else
    export IMPORT_CREATE_INDEX=false
    echo "Indexing DISABLED"
  fi

  $COMPOSE run --rm importer npm run import:schema
  ;;

  
  benchmark)
    export MSYS_NO_PATHCONV=1
    $COMPOSE run --rm --entrypoint k6 \
      -e K6_SUMMARY_EXPORT=/workload/reports/${MODE}.json \
      -v "$PWD/workload:/workload" \
      k6 run /workload/read_write.js
    ;;
  
  index)
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
    if [ "$MODE" == "replica" ]; then
       $COMPOSE exec -T mongo1 mongosh --quiet --eval 'db.getSiblingDB("app").dropDatabase()'
    else
       $COMPOSE exec -T mongo mongosh "mongodb://root:root@mongo:27017/app?authSource=admin" --quiet --eval 'db.dropDatabase()'
    fi
    echo "Database 'app' dropped."
    ;;
  
  *)
    echo "Usage: $0 {command} [mode]"
    echo ""
    echo "Commands:"
    echo "  up <mode>              - Start containers"
    echo "  down <mode>            - Stop containers"
    echo "  import-raw <mode>      - Raw import (Bad Schema / Strings)"
    echo "  import-schema <mode>   - Schema import (Optimized / Numbers)"
    echo "  benchmark <mode>       - Run k6 load test"
    echo "  index <mode>           - Create indexes"
    echo "  reset <mode>           - Full reset"
    echo "  reset-db <mode>        - Drop database only"
    echo ""
    echo "Modes:"
    echo "  baseline    - 8GB RAM"
    echo "  moderate    - 6.4GB RAM"
    echo "  constrained - 2GB RAM"
    exit 1;;
esac
