# 🛠️ All Benchmark Commands

Here is the complete list of benchmark commands organized by resource mode, including all parameter combinations.

## 🟢 Baseline (8GB RAM)
*High performance, no resource constraints.*

```bash
# 1. Default (Raw Data)
./dev.sh baseline

# 2. Text Indexing
./dev.sh baseline --index

# 3. Schema Optimization
./dev.sh baseline --schema

# 4. Replica Set
./dev.sh baseline --replica

# 5. Schema + Index
./dev.sh baseline --schema --index

# 6. Index + Replica
./dev.sh baseline --index --replica

# 7. Schema + Replica
./dev.sh baseline --schema --replica

# 8. All Together (Schema + Index + Replica)
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

# 5. Schema + Index
./dev.sh moderate --schema --index

# 6. Index + Replica
./dev.sh moderate --index --replica

# 7. Schema + Replica
./dev.sh moderate --schema --replica

# 8. All Together
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

# 5. Schema + Index
./dev.sh constrained --schema --index

# 6. Index + Replica
./dev.sh constrained --index --replica

# 7. Schema + Replica
./dev.sh constrained --schema --replica

# 8. All Together
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

# 5. Schema + Index
./dev.sh unbearable --schema --index

# 6. Index + Replica
./dev.sh unbearable --index --replica

# 7. Schema + Replica
./dev.sh unbearable --schema --replica

# 8. All Together
./dev.sh unbearable --index --schema --replica
```
