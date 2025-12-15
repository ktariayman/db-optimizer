# Database Optimization Lab

This lab demonstrates MongoDB performance optimization techniques across different resource constraints.

## 🎯 Overview

**Deployment Modes:**
- **Baseline** (8GB RAM) - High performance, no constraints
- **Moderate** (6.4GB RAM) - Moderate resource constraints  
- **Constrained** (2GB RAM) - Tight resource constraints

**Import Strategies:**
- **Raw Import** (`--raw`) - Legacy data (Strings)
- **Schema Import** (`--schema`) - Optimized data types (Numbers)

---

## 🚀 Quick Start

The project uses a unified automation script `dev.sh` that handles the entire lifecycle: **Reset Environment -> Import Data -> Run Benchmark**.

### Basic Usage

```bash
./dev.sh <MODE> [FLAGS]
```

### Examples

**1. Baseline Run (Legacy Data)**
```bash
./dev.sh baseline
```

**2. Optimized Run (Schema + Index)**
```bash
./dev.sh baseline --schema --index
```

**3. Constrained Resource Run**
```bash
./dev.sh constrained --schema
```

---

## 📊 Monitoring

- **Mongo Express UI**: http://localhost:8082
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

---

## 📁 File Structure

```
db-optimizer/
├── ops/                       # Docker Compose configurations
├── import/                    # Data import scripts
├── workloads/                 # K6 benchmark scripts
├── dev.sh                     # Main control script - AUTOMATED WORKFLOW
└── WORKFLOW.md                # detailed workflow for teammates
```

For more detailed workflow instructions, please refer to [WORKFLOW.md](./WORKFLOW.md).
