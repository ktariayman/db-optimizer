# Virtual Machine Setup & Lab Guide

This guide details how to set up the Database Optimization Lab on a fresh Virtual Machine (e.g., AWS EC2, Google Compute Engine, or a local VM).

## 1. Prerequisites

Ensure your VM has the following installed:
*   **OS**: Linux (Ubuntu 20.04/22.04 recommended)
*   **RAM**: At least 4GB (to run the baseline comfortably)
*   **Disk**: At least 10GB free space

### Install Docker & Docker Compose
```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker run hello-world
```

### Install Git
```bash
sudo apt-get install -y git
```

## 2. Project Setup

Clone the repository and navigate to the project directory:
```bash
git clone <YOUR_REPO_URL> db-optimizer
cd db-optimizer
```

## 3. Running the Lab

The lab is divided into three phases, controlled by the `dev.sh` script.

### Phase 1: Baseline (Normal Operation)
Run the system with ample resources (2GB RAM).

1.  **Start Environment**:
    ```bash
    ./dev.sh up baseline
    ```
2.  **Import Data**:
    ```bash
    ./dev.sh import baseline
    ```
3.  **Run Benchmark**:
    ```bash
    ./dev.sh baseline baseline
    ```
    *   Results will be saved to `workload/reports/baseline.json`.

### Phase 2: Constrained (The "Chaos")
Simulate a resource-constrained environment (250MB RAM).

1.  **Stop Previous Phase**:
    ```bash
    ./dev.sh down baseline
    ```
2.  **Start Constrained Environment**:
    ```bash
    ./dev.sh up constrained
    ```
    *   *Note: Data persists in the volume, so no need to re-import unless you wiped volumes.*
3.  **Run Benchmark**:
    ```bash
    ./dev.sh baseline constrained
    ```
    *   Results will be saved to `workload/reports/constrained.json`.
    *   **Expectation**: High latency, timeouts.

### Phase 3: Optimization (Replica Set / Indexing)
Recover performance using a Replica Set (Dual DB) and Indexing.

1.  **Stop Previous Phase**:
    ```bash
    ./dev.sh down constrained
    ```
2.  **Start Replica Environment**:
    ```bash
    ./dev.sh up replica
    ```
3.  **Apply Indexes**:
    ```bash
    ./dev.sh index replica
    ```
4.  **Run Benchmark**:
    ```bash
    ./dev.sh baseline replica
    ```
    *   Results will be saved to `workload/reports/replica.json`.

## 4. Comparing Results

After completing all phases, compare the JSON reports in `workload/reports/`.

*   **Baseline**: High throughput, low latency.
*   **Constrained**: Low throughput, high latency (due to disk I/O).
*   **Replica**: Improved throughput (reads distributed), improved latency (indexes).

## 5. Cleaning Up

To remove all containers and volumes:
```bash
./dev.sh down baseline
./dev.sh down constrained
./dev.sh down replica
```
