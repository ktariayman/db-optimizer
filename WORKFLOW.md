# Database Optimization Lab Guide (Recipes Edition)

This guide is designed to help you and your team understand the end-to-end workflow of optimizing a database under load. It simulates a real-world scenario where a system hits resource limits and requires architectural changes to recover performance.

## 🎯 Objective
Take a system from **"Unbearable"** (slow, constrained) to **"Optimized"** (fast, scalable) using database tuning techniques, using a **Recipes Dataset** (360MB+).

> **Note**: For setting up on a fresh Virtual Machine, see [VM_SETUP.md](./VM_SETUP.md).

---

## 1. Environment Setup (Baseline)
**Goal**: Get the lab running with ample resources (2GB RAM).

```bash
./dev.sh up baseline
```

---

## 2. Data Import
**Goal**: Load a realistic dataset to simulate a busy application.

```bash
./dev.sh import baseline
```
- **What it does**:
  - Reads `data/recipes_extended.json` (~360MB).
  - Inserts ~62,000 recipes into MongoDB (`recipes` collection).
  - Creates text indexes on `recipe_title` and `ingredients`.

---

## 3. Baseline Performance (The "Before" Picture)
**Goal**: Measure how the system performs *before* we break it.

```bash
./dev.sh baseline baseline
```
- **What it does**: Runs a **k6** load test with 64 concurrent users for 30 seconds.
- **Results**: Saved to `workload/reports/baseline.json`.

---

## 4. The "Chaos" Phase: Apply Constraints
**Goal**: Simulate a production outage or resource exhaustion (250MB RAM).

1.  **Switch to Constrained Mode**:
    ```bash
    ./dev.sh down baseline
    ./dev.sh up constrained
    ```
2.  **Verify Degradation**:
    ```bash
    ./dev.sh baseline constrained
    ```
- **Why**: By forcing MongoDB to work with less RAM than the dataset size (360MB > 250MB), we force it to read from disk (slow).
- **Results**: Saved to `workload/reports/constrained.json`.

---

## 5. Optimization Phase: Fixing the Problem
Now that the system is slow, we apply techniques to fix it.

### A. Indexing (The "Low Hanging Fruit")
**Goal**: Speed up queries by avoiding full collection scans.

```bash
./dev.sh index constrained
```
- **What it does**: Creates indexes to support common queries.
- **Expected Result**: Massive drop in latency.

### B. Read/Write Splitting (Scaling Out)
**Goal**: Handle more traffic by adding more servers.

1.  **Switch to Replica Mode**:
    ```bash
    ./dev.sh down constrained
    ./dev.sh up replica
    ```
2.  **Rerun Benchmark**:
    ```bash
    ./dev.sh baseline replica
    ```
- **Why**: A single server has limits. By splitting the work (Writes -> Primary, Reads -> Secondary), we double our capacity.
- **Results**: Saved to `workload/reports/replica.json`.

---

## 6. Analysis & Reflection
**Goal**: Prove that your changes worked.

Compare the reports in `workload/reports/`:
1.  **baseline.json**: Normal performance.
2.  **constrained.json**: "Unbearable" slowness.
3.  **replica.json**: Recovered speed and increased capacity.

Run the comparison tool:
```bash
./dev.sh compare
```

### Key Takeaways
- **Indexes are critical**: They are the first line of defense against slow queries.
- **Resources matter**: Performance is relative to available RAM vs. Data Size.
- **Architecture scales**: When vertical scaling (more RAM) isn't enough, horizontal scaling (more nodes) helps.
