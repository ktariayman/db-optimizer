# DB Performance Lab (Docker-first)

This project is a minimal, enterprise-style lab to:
1) **Ingest** a dataset into Postgres,
2) **Hammer** read/write endpoints,
3) **Constrain** resources (memory/CPU) and observe p95 latency,
4) **Optimize** with DB techniques (indexes/partitioning/replica),
5) **Report** numbers (baseline vs constrained vs optimized).

## Folder layout
```
app/        # Fastify API (Node.js + pg)
import/     # Importer (loads 80%, saves 20% to data/heldout.json)
schema/     # SQL DDL (start here)
data/       # dataset.csv (sample included)
workload/   # k6 scripts
ops/        # docker-compose.yml
Makefile
```

## Quick start
```bash
# 0) Ensure Docker + Docker Compose are installed
cd db-perf-lab

# 1) Start stack
make up

# 2) Import baseline (80%) from data/dataset.csv
make import

# 3) Health check
make health

# 4) Run baseline workload (records p95)
make baseline
```

The sample dataset (`data/dataset.csv`) has 20 rows to test the pipeline. Replace it with your real dataset (same columns).

## Constrain resources
Edit `ops/docker-compose.yml` and add limits to the `db` service, e.g.:
```yaml
  db:
    image: postgres:16
    deploy:
      resources:
        limits:
          memory: 1.5g
          cpus: "1.0"
```
Rebuild/restart then re-run `make baseline` to compare p95. Tighten until **p95 > 1s**.

## Notes
- The importer mounts `schema/` and `data/` into the container. It runs DDL then inserts 80% of the rows in batches, and writes the remaining 20% to `data/heldout.json` (which you can POST to `/ingest` during tests).
- The API exposes:
  - `GET /events?tenant_id=1&limit=100` (hot read path)
  - `POST /ingest` (write path; accepts one event or an array)
- The k6 workload defaults to **70% reads / 30% writes**, 32 virtual users, 2 minutes.

## Next (Optimization Steps)
- Add **composite/covering indexes** for your hot filters.
- Consider **partitioning** `events` by time or tenant and verify partition pruning.
- Introduce **PgBouncer** for pooling.
- Try a **read replica** for GET endpoints.
- Use `EXPLAIN (ANALYZE, BUFFERS)` to prove plan improvements.
```



## Dev mode (hot reload inside Docker)
Use the dev override to run the API with **ts-node-dev** and bind-mounted source:

```bash
# Start Postgres + API in dev (hot reload)
make up-dev

# Tail backend logs
make logs-dev

# Stop dev stack
make down-dev
```

Notes:
- Source code changes in `app/src` trigger automatic reloads.
- Node inspector is exposed on `localhost:9229` if you want to attach a debugger.
- We keep `node_modules` inside the container to avoid host/OS conflicts.
