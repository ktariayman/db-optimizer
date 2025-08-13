#!/usr/bin/env bash
set -e

COMPOSE_BASE="docker compose -f ops/docker-compose.yml"
COMPOSE_DEV="$COMPOSE_BASE -f ops/docker-compose.dev.yml"

case "$1" in
  up)        $COMPOSE_BASE up -d --build ;;
  down)      $COMPOSE_BASE down -v ;;
  up-dev)    $COMPOSE_DEV up -d --build ;;
  down-dev)  $COMPOSE_DEV down -v ;;
  logs-dev)  $COMPOSE_DEV logs -f api ;;
  import)    $COMPOSE_BASE run --rm importer ;;
  baseline)  $COMPOSE_BASE run --rm k6 k6 run /workload/read_write.js ;;
  health)    curl -s http://localhost:8080/health || true ;;
  *)
    echo "Usage: $0 {up|down|up-dev|down-dev|logs-dev|import|baseline|health}"; exit 1;;
esac
