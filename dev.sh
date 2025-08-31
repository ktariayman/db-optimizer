#!/usr/bin/env bash
set -e

COMPOSE="docker compose -f ops/docker-compose.yml"

case "$1" in
  up)        $COMPOSE up -d --build ;;
  down)      $COMPOSE down -v ;;
  logs)      $COMPOSE logs -f api ;;
  import)    $COMPOSE run --rm importer npm run import:rr ;;
  baseline)
    export MSYS_NO_PATHCONV=1
    $COMPOSE run --rm --entrypoint k6 \
      -e K6_SUMMARY_EXPORT=/workload/reports/baseline.json \
      -v "$PWD/workload:/workload" \
      k6 run /workload/read_write.js
    ;;
  constrained)
    echo "Edit ops/docker-compose.yml mongo.wiredTigerCacheSizeGB lower, then: ./dev.sh down && ./dev.sh up && ./dev.sh baseline"
    ;;
  index)
    $COMPOSE exec -T mongo \
      mongosh "mongodb://root:root@mongo:27017/app?authSource=admin" --eval \
'db.events_rr.createIndex({ visitorid: 1, timestamp: -1 })'
    ;;
  health)    curl -s http://localhost:8080/health || true ;;
  up-dev)    $COMPOSE up -d --build ;;   # kept for muscle memory
  down-dev)  $COMPOSE down -v ;;
  logs-dev)  $COMPOSE logs -f api ;;
  *)
    echo "Usage: $0 {up|down|logs|import|baseline|constrained|index|health|up-dev|down-dev|logs-dev}"
    exit 1;;
esac
