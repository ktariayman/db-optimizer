#!/usr/bin/env bash
set -e

MODE=${2:-baseline} # Default to baseline if not specified
COMPOSE_FILE="ops/docker-compose.baseline.yml"

if [ "$MODE" == "constrained" ]; then
  COMPOSE_FILE="ops/docker-compose.constrained.yml"
elif [ "$MODE" == "replica" ]; then
  COMPOSE_FILE="ops/docker-compose.replica.yml"
elif [ "$MODE" == "local" ]; then
  COMPOSE_FILE="ops/docker-compose.local.yml"
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
    elif [ "$MODE" == "local" ]; then
       # For local, we can't exec into a container. We assume user has mongosh or we use the importer container to run a script?
       # Actually, the import script now creates the index automatically! So we might not need this for local.
       # But if we want to force it:
       $COMPOSE run --rm importer node -e '
         const { MongoClient } = require("mongodb");
         const client = new MongoClient("mongodb://host.docker.internal:27017/app");
         client.connect().then(async () => {
           await client.db().collection("recipes").createIndex({ recipe_title: "text", ingredients: "text" });
           console.log("Index created on local DB");
           client.close();
         });
       '
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
