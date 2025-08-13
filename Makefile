\
SHELL := /bin/bash

compose := docker compose -f ops/docker-compose.yml

up:
	$(compose) up -d --build

down:
	$(compose) down -v

import:
	# Loads 80% baseline, writes 20% to data/heldout.json
	$(compose) run --rm importer

health:
	$(compose) exec -T api curl -s http://localhost:8080/health || true

baseline:
	# Run the default workload (k6) against the API within the compose network
	$(compose) run --rm k6 k6 run /workload/read_write.js

# Example: Constrain DB (edit and uncomment limits)
# Then re-run `make baseline` to compare
# db-constrained:
# 	$(compose) stop db
# 	# Use mem/cpu limits by overriding service (or edit compose file):
# 	docker run -d --rm --name db_constrained \
# 		--network host \
# 		--memory=1.5g --cpus=1.0 \
# 		-e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=app \
# 		-v db-perf-lab_pgdata:/var/lib/postgresql/data \
# 		postgres:16

clean:
	$(compose) down -v


# --- Dev mode (hot reload) ---
up-dev:
	docker compose -f ops/docker-compose.yml -f ops/docker-compose.dev.yml up -d --build

down-dev:
	docker compose -f ops/docker-compose.yml -f ops/docker-compose.dev.yml down -v

logs-dev:
	docker compose -f ops/docker-compose.yml -f ops/docker-compose.dev.yml logs -f api
