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
sudo bash ./dev.sh up baseline
```

### 2. Import Data
```bash
# 1. Import Legacy Data (Strings)
sudo bash ./dev.sh import-raw baseline

# 2. Import Optimized Data (Numbers)
sudo bash ./dev.sh import-schema baseline
```

### 3. Run Benchmark
```bash
sudo bash ./dev.sh benchmark baseline
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
sudo bash ./dev.sh reset
sudo bash ./dev.sh up constrained
sudo bash ./dev.sh import-raw constrained
sudo bash ./dev.sh benchmark constrained

# 2. Apply schema optimization 
sudo bash ./dev.sh reset-db constrained
sudo bash ./dev.sh import-schema constrained
sudo bash ./dev.sh benchmark constrained

# 3. Compare results
sudo bash ./dev.sh compare
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
  sudo bash ./dev.sh reset
  sudo bash ./dev.sh up $MODE
  sudo bash ./dev.sh import-schema $MODE
  sudo bash ./dev.sh benchmark $MODE
done

sudo bash ./dev.sh compare
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
sudo bash ./dev.sh up <mode>           # Start containers
sudo bash ./dev.sh down <mode>         # Stop and remove containers
sudo bash ./dev.sh reset <mode>        # Full reset (down + up)
sudo bash ./dev.sh logs <mode>         # View API logs
```

### Data Operations
```bash
sudo bash ./dev.sh import-raw <mode>     # Import legacy data (Strings)
sudo bash ./dev.sh import-schema <mode>  # Import optimized data (Numbers)
sudo bash ./dev.sh reset-db <mode>       # Drop database only
sudo bash ./dev.sh index <mode>          # Create text indexes
```

### Testing
```bash
sudo bash ./dev.sh benchmark <mode>    # Run k6 load test
sudo bash ./dev.sh health <mode>       # Check API health
sudo bash ./dev.sh compare             # Compare benchmark results
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
