# Database Performance Optimization — Reproducible Lab

## 🎯 Objective

This project demonstrates end-to-end database performance optimization using a **real dataset**, **load testing**, and **resource constraints**.  
You will simulate a production-like workload (reads/writes), then progressively improve performance with database tuning techniques.

---

## 🧠 Steps Overview

1. **Import Dataset into MongoDB**

   - Use a CSV dataset (e.g., retailrocket events)
   - Import 80% of data, hold 20% aside for continuous load simulation.

2. **Simulate Heavy Load**

   - Run `k6` with high concurrency (64 virtual users).
   - Measure **latency (avg / p95)** and **throughput (req/s)**.

3. **Constrain Resources**

   - Limit MongoDB memory (`--wiredTigerCacheSizeGB` 2.0 → 1.6 GB).
   - Observe latency spikes and reduced throughput.

4. **Apply DB Optimizations**

   - **Schema optimization**: ensure numeric and indexed fields.
   - **Add Index**: `visitorid + timestamp` compound index.
   - **Dual DB setup**: split reads/writes between two Mongo instances.

5. **Compare Results**
   - Analyze improvements across configurations using the provided `reports/`.

---

## 🧩 Architecture

```
Docker Compose (ops/docker-compose.yml)
 ├── MongoDB (primary, optional secondary)
 ├── Fastify API (Node.js + TypeScript)
 ├── Importer (data ingestion)
 ├── k6 (load generator)
 └── Grafana + Prometheus (optional monitoring)
```

---

## 🧪 Load Testing Scenarios

| Scenario        | Config         | Avg Latency (ms) | p95 (ms)  | Throughput (req/s) | Notes              |
| --------------- | -------------- | ---------------- | --------- | ------------------ | ------------------ |
| Baseline        | 2.5 GB         | 15.13            | 39.62     | 972.5              | Stable             |
| Constrained     | 2.0 GB         | 15.65            | 39.75     | 964.9              | Slight degradation |
| Indexed         | 2.0 GB + Index | 10.03            | 27.43     | 1055.0             | Major improvement  |
| Dual DB         | 2 DBs          | 11.58            | 31.86     | 1028.0             | Slight improvement |
| Dual DB + Index | 2 DBs + Index  | **10.42**        | **30.07** | **1048.3**         | Best overall       |

---

## 🚀 Quick Start

### 1️⃣ Clone and setup

```bash
git clone https://github.com/yourname/db-optimizer-lab.git
cd db-optimizer-lab
```

### 2️⃣ Run environment

```bash
./dev.sh up
```

### 3️⃣ Import dataset

```bash
./dev.sh import
```

### 4️⃣ Run baseline benchmark

```bash
./dev.sh baseline
```

### 5️⃣ Apply index and rerun

```bash
./dev.sh index
./dev.sh baseline
```

### 6️⃣ Enable second DB (read replica)

```bash
docker compose -f ops/docker-compose.yml up -d mongo2
# Edit API to route GET /events → mongo2
./dev.sh baseline
```

---

## ⚙️ Configuration

### `.env`

```env
MONGO_URL=mongodb://mongo:27017/testdb
PORT=8080
```

### `docker-compose.yml`

```yaml
mongo:
  image: mongo:7
  container_name: mongo
  command: ['--wiredTigerCacheSizeGB=2.0']
  ports:
    - '27017:27017'
  volumes:
    - mongo_data:/data/db
api:
  build: ./app
  ports:
    - '8080:8080'
  environment:
    - MONGO_URL=mongodb://mongo:27017/testdb
k6:
  image: grafana/k6
  volumes:
    - ./workload:/scripts
  command: ['run', '/scripts/read_write.js']
volumes:
  mongo_data:
```

---

## 📊 Interpreting Results

### Latency

- **Avg latency**: average response time per request.
- **p95 latency**: 95% of requests complete within this duration.

### Throughput

- **Requests per second** under 64 concurrent users.

| Metric   | Before Optimization | After Index | After Dual DB |
| -------- | ------------------- | ----------- | ------------- |
| Avg (ms) | 15.6                | **10.4**    | **10.4**      |
| p95 (ms) | 39.7                | **27.4**    | **30.0**      |
| Req/s    | 965                 | **1055**    | **1048**      |

---

## 💡 Key Insights

- Index reduced query time by ~35%.
- Two DBs reduced contention and kept latency low under load.
- Schema optimization reduced unnecessary scanning.
- Vertical scaling isn’t always best — horizontal DB duplication can help.

---

## 🧭 Future Improvements

- Add **read replica** balancing.
- Experiment with **Redis caching**.
- Use **connection pooling** via `maxPoolSize`.
- Predict future scale using Grafana dashboards.

---

## 🧾 References

- [k6.io](https://k6.io)
- [MongoDB Indexing Docs](https://www.mongodb.com/docs/manual/indexes/)
- [Fastify Framework](https://www.fastify.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
