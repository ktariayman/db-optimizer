# Database Optimization Lab - Workflow

This lab demonstrates MongoDB performance optimization techniques across different resource constraints.

## 🎯 Overview

**Deployment Modes:**
- **Baseline** (8GB RAM) - High performance, no constraints
- **Moderate** (6.4GB RAM) - Moderate resource constraints  
- **Constrained** (2GB RAM) - Tight resource constraints

**Import Strategies:**
- **Raw Import** (`import-raw`) - Simulates legacy data (Strings)
- **Schema Import** (`import-schema`) - Optimized data types (Numbers)

---

## 📋 Quick Start

### 1. Start Environment
```bash
# Choose your mode: baseline | moderate | constrained
sudo bash up baseline
```

### 2. Import Data
```bash
# 1. Import Legacy Data (Strings)
sudo bash import-raw baseline

# 2. Import Optimized Data (Numbers)
sudo bash import-schema baseline
```

### 3. Run Benchmark
```bash
sudo bash benchmark baseline
```

### 4. View Results
- **Mongo Express UI**: http://localhost:8082
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

---

## 🔬 Optimization Experiments

### Experiment 1: Schema Optimization Impact

**Question**: Does using proper data types improve performance?

```bash
# 1. Baseline with bad schema (strings)
sudo bash reset
sudo bash up constrained
sudo bash import-raw constrained
sudo bash benchmark constrained

# 2. Apply schema optimization (numbers)
sudo bash reset-db constrained
sudo bash import-schema constrained
sudo bash benchmark constrained

# 3. Compare results
sudo bash compare
```

**Expected Result**: Optimized schema should show:
- Lower latency (faster queries)
- Higher throughput (more requests/sec)
- Less memory usage

---

### Experiment 2: Resource Constraints Impact

**Question**: How do resource constraints affect performance?

```bash
# Test each mode with optimized schema
for MODE in baseline moderate constrained; do
  sudo bash reset
  sudo bash up $MODE
  sudo bash import-schema $MODE
  sudo bash benchmark $MODE
done

sudo bash compare
```

**Expected Result**: Performance degrades as RAM decreases.

---

## 📊 Monitoring

### Mongo Express (Database UI)
- URL: http://localhost:8082
- View collections, documents, indexes
- Run queries manually

### Grafana Dashboards
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin`
- Pre-configured MongoDB metrics

### Prometheus Metrics
- URL: http://localhost:9090
- Raw metrics from MongoDB exporter

---

## 🛠️ Commands Reference

### Environment Management
```bash
sudo bash up <mode>           # Start containers
sudo bash down <mode>         # Stop and remove containers
sudo bash reset <mode>        # Full reset (down + up)
sudo bash logs <mode>         # View API logs
```

### Data Operations
```bash
sudo bash import-raw <mode>     # Import legacy data (Strings)
sudo bash import-schema <mode>  # Import optimized data (Numbers)
sudo bash reset-db <mode>       # Drop database only
sudo bash index <mode>          # Create text indexes
```

### Testing
```bash
sudo bash benchmark <mode>    # Run k6 load test
sudo bash health <mode>       # Check API health
sudo bash compare             # Compare benchmark results
```

---

## 📁 File Structure

```
db-optimizer/
├── ops/
│   ├── docker-compose.baseline.yml    # 8GB RAM
│   ├── docker-compose.moderate.yml    # 6.4GB RAM
│   ├── docker-compose.constrained.yml # 2GB RAM
│   └── docker-compose.replica.yml     # Replica set
├── import/
│   └── src/
│       ├── import.withschema.ts       # Mongoose import (Optimized)
│       ├── import.withoutschema.ts    # Raw MongoDB import (Legacy)
│       ├── models/
│       │   └── scehma.mongoose.ts     # Mongoose schema
│       └── services/
│           └── recipeImport.service.ts
├── app/
│   └── src/
│       └── index.ts                   # Fastify API
├── workload/
│   └── read_write.js                  # k6 load test
└── dev.sh                             # Main control script
```
