#!/usr/bin/env bash
set -e

# Function to execute a benchmark step sequentially with a pause
run_step() {
  echo ""
  echo "#################################################################"
  echo "▶ RUNNING: ./dev.sh $@"
  echo "#################################################################"
  
  ./dev.sh "$@"
  
  echo ""
  echo "✔ FINISHED: ./dev.sh $@"
  echo "⏳ Pausing for 5 seconds to ensure clean tear-down..."
  sleep 5
  echo "-----------------------------------------------------------------"
}

echo "🚀 STAY CALM! Running all benchmarks sequentially..."
echo "This may take a SIGNIFICANT amount of time (32 runs)."
echo "================================================================="

# -----------------------------
# Baseline (8GB RAM)
# -----------------------------
run_step baseline
run_step baseline --index
run_step baseline --schema
run_step baseline --replica
run_step baseline --schema --index
run_step baseline --index --replica
run_step baseline --schema --replica
run_step baseline --index --schema --replica

# -----------------------------
# Moderate (6GB RAM)
# -----------------------------
run_step moderate
run_step moderate --index
run_step moderate --schema
run_step moderate --replica
run_step moderate --schema --index
run_step moderate --index --replica
run_step moderate --schema --replica
run_step moderate --index --schema --replica

# -----------------------------
# Constrained (3GB RAM)
# -----------------------------
run_step constrained
run_step constrained --index
run_step constrained --schema
run_step constrained --replica
run_step constrained --schema --index
run_step constrained --index --replica
run_step constrained --schema --replica
run_step constrained --index --schema --replica

# -----------------------------
# Unbearable (2GB RAM)
# -----------------------------
run_step unbearable
run_step unbearable --index
run_step unbearable --schema
run_step unbearable --replica
run_step unbearable --schema --index
run_step unbearable --index --replica
run_step unbearable --schema --replica
run_step unbearable --index --schema --replica

echo ""
echo "======================================================="
echo "✅ All Benchmarks Completed Successfully!"
