# Database Optimization Lab Guide (Recipes Edition)

This guide is designed to help you and your team understand the end-to-end workflow of optimizing a database under load. It simulates a real-world scenario where a system hits resource limits and requires architectural changes to recover performance.

## 🎯 Objective
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
