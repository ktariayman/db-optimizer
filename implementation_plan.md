# New User Onboarding Simulation Plan

The goal is to verify the project's usability for a new team member who has just cloned the repo and installed Docker. I will execute the standard workflow defined in `WORKFLOW.md`.

## User Review Required

> [!NOTE]
> I will be running Docker commands that will stop and remove existing containers (`./dev.sh down`). This ensures a clean state.

## Proposed Steps

### 1. Preparation
- [ ] **Update Documentation**: Add "New Team Member Checklist" to `README.md`.
- [ ] Verify `WORKFLOW.md` instructions are clear.
- [ ] Ensure `dev.sh` is executable (it is).
- [ ] Clean up any running containers from previous sessions.

### 2. Phase 1: Baseline (The "Before" Picture)
- [ ] Start Environment: `./dev.sh up baseline`
- [ ] Import Data: `./dev.sh import baseline`
- [ ] Run Benchmark: `./dev.sh baseline baseline`
- [ ] **Verify**: Check `workload/reports/baseline.json` exists.

### 3. Phase 2: Constrained (The "Chaos")
- [ ] Switch Environment: `./dev.sh down baseline && ./dev.sh up constrained`
- [ ] Run Benchmark: `./dev.sh baseline constrained`
- [ ] **Verify**: Check `workload/reports/constrained.json` exists and shows degradation.

### 4. Phase 3: Optimization (The Fix)
- [ ] Switch Environment: `./dev.sh down constrained && ./dev.sh up replica`
- [ ] Apply Indexing: `./dev.sh index replica`
- [ ] Run Benchmark: `./dev.sh baseline replica`
- [ ] **Verify**: Check `workload/reports/replica.json` exists.

### 5. Analysis
- [ ] Run Comparison: `./dev.sh compare`
- [ ] **Goal**: See the progression from Good -> Bad -> Good (with higher capacity).

## Verification
- The final output of `./dev.sh compare` will be the proof of success.
