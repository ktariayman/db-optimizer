# 🛠️ All Benchmark Commands

Here is the complete list of benchmark commands organized by resource mode.

## 🟢 Baseline (8GB RAM)
*High performance, no resource constraints.*

```bash
# 1. Default (Raw Data, No Index, Standalone)
./dev.sh baseline

# 2. Text Indexing (Raw Data, Indexed)
./dev.sh baseline --index

# 3. Schema Optimization (Numbers instead of Strings)
./dev.sh baseline --schema

# 4. Replica Set (High Availability Architecture)
./dev.sh baseline --replica

# 5. Full Optimization (Schema + Index + Replica)
./dev.sh baseline --index --schema --replica
```

---

## 🟡 Moderate (6GB RAM)
*Moderate resource constraints.*

```bash
# 1. Default
./dev.sh moderate

# 2. Text Indexing
./dev.sh moderate --index

# 3. Schema Optimization
./dev.sh moderate --schema

# 4. Replica Set
./dev.sh moderate --replica

# 5. Full Optimization
./dev.sh moderate --index --schema --replica
```

---

## 🟠 Constrained (3GB RAM)
*Significant resource constraints.*

```bash
# 1. Default
./dev.sh constrained

# 2. Text Indexing
./dev.sh constrained --index

# 3. Schema Optimization
./dev.sh constrained --schema

# 4. Replica Set
./dev.sh constrained --replica

# 5. Full Optimization
./dev.sh constrained --index --schema --replica
```

---

## 🔴 Unbearable (2GB RAM)
*Extreme resource constraints (Stress Test).*

```bash
# 1. Default
./dev.sh unbearable

# 2. Text Indexing
./dev.sh unbearable --index

# 3. Schema Optimization
./dev.sh unbearable --schema

# 4. Replica Set
./dev.sh unbearable --replica

# 5. Full Optimization
./dev.sh unbearable --index --schema --replica
```
