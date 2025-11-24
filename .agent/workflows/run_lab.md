---
description: Run the full Database Optimization Lab
---

# Database Optimization Lab Workflow

This workflow automates the steps to run the lab, from setup to load testing.

## 1. Setup Environment
// turbo
./dev.sh up

## 2. Import Data (Recipes)
// turbo
./dev.sh import

## 3. Run Baseline Load Test
// turbo
./dev.sh baseline

## 4. Instructions for Constraints
echo "To proceed with the lab, you must now manually edit 'ops/docker-compose.yml' to reduce memory, then run './dev.sh down && ./dev.sh up'."
