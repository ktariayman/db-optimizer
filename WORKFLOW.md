# Database Optimization Lab Guide

This guide is designed to help you and your team understand the end-to-end workflow of optimizing a database under load. It simulates a real-world scenario where a system hits resource limits and requires architectural changes to recover performance.

## 🎯 Objective
Take a system from **"Unbearable"** (slow, constrained) to **"Optimized"** (fast, scalable) using database tuning techniques.

---

## 1. Environment Setup
**Goal**: Get the lab running on your local machine.

```bash
./dev.sh up
```
- **What it does**: Starts MongoDB, the API server, and monitoring tools using Docker Compose.
- **Why**: We need a reproducible environment that mimics a production setup.

---

## 2. Data Import
**Goal**: Load a realistic dataset to simulate a busy application.

```bash
./dev.sh import
```
- **What it does**:
  - Reads `data/events.csv` (RetailRocket dataset).
  - Inserts 80% of records into MongoDB (`events_rr` collection).
  - Saves 20% to `heldout.json` for future use.
- **Why**: Performance problems often only appear with sufficient data volume. We need enough data to exceed our memory constraints later.

---

## 3. Baseline Performance (The "Before" Picture)
**Goal**: Measure how the system performs *before* we break it.

```bash
./dev.sh baseline
```
- **What it does**: Runs a **k6** load test with 64 concurrent users for 30 seconds.
- **Metrics to watch**:
  - `http_req_duration` (p95): 95% of requests should be fast (e.g., < 50ms).
  - `http_reqs` (Throughput): How many requests per second can we handle?

---

## 4. The "Chaos" Phase: Apply Constraints
**Goal**: Simulate a production outage or resource exhaustion.

1.  **Edit Configuration**: Open `ops/docker-compose.yml` and reduce memory.
    ```yaml
    # Find the mongo service
    command: ['--wiredTigerCacheSizeGB=0.25'] # Reduce to 250MB
    ```
2.  **Apply Changes**:
    ```bash
    ./dev.sh down && ./dev.sh up
    ```
3.  **Verify Degradation**:
    ```bash
    ./dev.sh baseline
    ```
- **Why**: By forcing MongoDB to work with less RAM than the dataset size, we force it to read from disk (slow) instead of memory (fast). This causes latency to spike, simulating a "meltdown."

---

## 5. Optimization Phase: Fixing the Problem
Now that the system is slow, we apply techniques to fix it.

### A. Indexing (The "Low Hanging Fruit")
**Goal**: Speed up queries by avoiding full collection scans.

```bash
./dev.sh index
```
- **What it does**: Creates a compound index on `{ visitorid: 1, timestamp: -1 }`.
- **Why**: Without an index, MongoDB must look at *every single document* to find a specific visitor. With an index, it jumps straight to the relevant records.
- **Expected Result**: Massive drop in latency (e.g., 1000ms -> 10ms).

### B. Read/Write Splitting (Scaling Out)
**Goal**: Handle more traffic by adding more servers.

1.  **Enable Second DB**: Uncomment `mongo2` in `ops/docker-compose.yml`.
2.  **Update API**: Configure the API to send `GET` requests to `mongo2` and `POST` requests to `mongo`.
3.  **Rerun Benchmark**:
    ```bash
    ./dev.sh baseline
    ```
- **Why**: A single server has limits. By splitting the work (Writes -> Primary, Reads -> Secondary), we double our capacity for read-heavy workloads.

---

## 6. Analysis & Reflection
**Goal**: Prove that your changes worked.

Compare the reports in `workload/reports/`:
1.  **Baseline**: Normal performance.
2.  **Constrained**: "Unbearable" slowness.
3.  **Indexed**: Recovered speed (Latency improvement).
4.  **Dual DB**: Increased capacity (Throughput improvement).

### Key Takeaways
- **Indexes are critical**: They are the first line of defense against slow queries.
- **Resources matter**: Performance is relative to available RAM vs. Data Size.
- **Architecture scales**: When vertical scaling (more RAM) isn't enough, horizontal scaling (more nodes) helps.
