# 🚀 Database Optimization Lab - Workflow for Teammates

This guide provides a standardized workflow for running database optimization experiments using the `dev.sh` automation script.

## 📋 Overview

The `dev.sh` script is the single entry point for all experiments. It automatically handles:
1.  **Environment Reset**: Tears down and rebuilds containers.
2.  **Data Import**: Imports data (legacy string or optimized schema).
3.  **Indexing**: Optionally adds indexes.
4.  **Benchmarking**: Runs the K6 load test.

---

## 🛠️ Usage

### Basic Command Structure

```bash
./dev.sh <MODE> [FLAGS]
```

### Modes (Required)
| Mode | RAM Limit | Description |
| :--- | :--- | :--- |
| `baseline` | 8GB | No constraints. High performance reference. |
| `moderate` | 6.4GB | Moderate constraints. Testing efficiency. |
| `constrained` | 2GB | Tight constraints. Stress testing optimization. |

### Flags (Optional)
| Flag | Description |
| :--- | :--- |
| `--schema` | Use **Optimized Schema** (Numbers instead of Strings). Default is Raw. |
| `--index` | Apply **Text Indexes** to the database. Default is No Index. |
| `--replica` | Use **Replica Set** architecture. Default is Standalone. |

---

## 🧪 Standard Experiments

Run these commands to replicate our standard test cases.

### 1. Baseline Run (The "Bad" Case)
*Scenario: Legacy data (Strings), no indexes, ample RAM.*
```bash
./dev.sh baseline
```

### 2. Schema Optimization
*Scenario: Optimized data types (Numbers), no indexes, ample RAM.*
```bash
./dev.sh baseline --schema
```

### 3. Full Optimization (Schema + Indexing)
*Scenario: Optimized data types + Indexing.*
```bash
./dev.sh baseline --schema --index
```

### 4. Stress Test (Constrained RAM)
*Scenario: Full optimization under tight memory constraints.*
```bash
./dev.sh constrained --schema --index
```

---

## 📊 Analyzing Results

### Benchmark Reports
After every run, a JSON report is saved to:
`workload/reports/<MODE>-[flags].json`

Example: `workload/reports/baseline-schema.json`

### Monitoring Tools
While the benchmark is running (or after), check these dashboards:

- **Mongo Express**: [http://localhost:8082](http://localhost:8082) (View Data)
- **Grafana**: [http://localhost:3000](http://localhost:3000) (Metrics)
  - *User/Pass:* `admin` / `admin`
- **Prometheus**: [http://localhost:9090](http://localhost:9090) (Raw Metrics)
