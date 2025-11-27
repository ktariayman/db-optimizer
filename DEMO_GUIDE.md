# 🚀 Database Optimization Demo Guide

**Scenario**: We have a "Recipes" app that is running slowly on a constrained VM. We will fix it live using Schema Optimization.

## 1. Setup (Do this NOW before demo starts)
Ensure the environment is clean and running in constrained mode.

```bash
./dev.sh down baseline
./dev.sh down constrained
./dev.sh up constrained
./dev.sh import constrained default  # Imports "Bad" Schema (Strings)
```

---

## 2. The Demo (Live)

### Step 1: Show the Problem (Baseline)
"Let's see how our current system performs with the unoptimized schema."

```bash
./dev.sh baseline constrained
```
*   **Show Results**: Look at `http_req_duration` (p95). It should be high (slow).
*   **Explain**: "We are storing numbers as strings. This wastes space and makes queries slower."

### Step 2: Apply the Fix (Schema Optimization)
"Now, let's optimize the schema by converting those fields to proper Integers."

```bash
./dev.sh optimize-schema constrained
```
*   **What is happening**: The script drops the DB and re-imports data, converting `cook_time`, `prep_time`, etc., to Numbers.

### Step 3: Verify Improvement
"Let's run the benchmark again."

```bash
./dev.sh baseline constrained
```
*   **Show Results**: Compare with Step 1. You should see lower latency and higher throughput!

---

## 3. Bonus: Indexing & Replication
If you have time, show the other optimizations:

```bash
./dev.sh index constrained
./dev.sh baseline constrained
```
