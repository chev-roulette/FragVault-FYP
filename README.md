# 🛡️ FragVault

> **Distributed API Token Storage with Secret Fragmentation: Reducing Attack Surface in Compromised Vault Environments**

FragVault is a proof-of-concept distributed API-token storage system built to eliminate single points of failure in centralized secret management. Instead of storing plaintext tokens in a single vault, FragVault uses **XOR-based secret fragmentation** to split credentials across multiple isolated storage nodes.

Developed as a Final Year Project (FYP) for a Bachelor of Science (Honours) in Computer Science (Cyber Security) at Asia Pacific University (APU).


---


## ✨ Core Features

* **🔀 XOR-Based Secret Fragmentation**: Splits an API token into three independent fragments (`Fragment A`, `Fragment B`, and `Fragment C`). No single storage location holds the complete credential.


* **🗄️ Isolated PostgreSQL Vaults**: Stores each fragment type in a logically separate PostgreSQL vault table (`vault_a_fragments`, `vault_b_fragments`, `vault_c_fragments`) protected by restricted database roles enforcing least privilege.


* **🔒 Integrity-Protected Reconstruction**: Uses SHA-256 hashing to verify fragment integrity prior to reassembling tokens, instantly blocking unauthorized modifications or tampering.


* **🎯 Live Attack Simulation & Logging**: Simulates single-vault compromises, fragment exfiltration, and cross-vault access attempts, parsing PostgreSQL JSON logs to record security events persistently in an audit database.


---


## 🏗️ How It Works (System Architecture)

1. **Fragmentation**: The backend generates two cryptographically random byte arrays (`Fragment A` and `Fragment B`). `Fragment C` is dynamically calculated using a bitwise XOR operation:



$$\text{Fragment C} = \text{Token} \oplus \text{Fragment A} \oplus \text{Fragment B}$$


2. **Storage**: Each fragment is hashed with SHA-256 and sent to its respective isolated PostgreSQL vault table.


3. **Reconstruction**: To retrieve the original token, all three fragments must be successfully recovered and pass integrity checks:



$$\text{Token} = \text{Fragment A} \oplus \text{Fragment B} \oplus \text{Fragment C}$$


---


## 🚀 Quick Start Guide

### Prerequisites

* [Docker Desktop](https://www.docker.com/) installed and running.


* Git installed on your machine.

### Installation & Local Deployment

1. **Clone the repository**:
```bash
git clone https://github.com/YOUR_USERNAME/FragVault-FYP.git
cd FragVault-FYP

```


2. **Spin up the infrastructure (PostgreSQL Vaults & Audit DB)** using Docker Compose:


```bash
docker compose up --build -d

```


3. **Access the Application**:
* **Frontend UI (React)**: Open `http://localhost:5173` in your browser.


* **Backend API Docs (FastAPI)**: Open `http://localhost:8000/docs`.


---


## 🛡️ Security Evaluation & Attack Simulation

FragVault includes an interactive **Attack Simulation** module to demonstrate system resilience against database compromises:

* **Partial Compromise (1 or 2 Fragments Exposed)**: Containment remains active, and attacker reconstruction is completely blocked (0% reconstruction risk).


* **Full Compromise (All 3 Fragments Exposed)**: Only when all three vaults are simultaneously breached can the token be reassembled.


* **Log Auditing**: Unauthorized cross-vault queries (violating least-privilege database roles) are caught by PostgreSQL security logs, processed by the FastAPI backend, and flagged in the live **Attack Event Timeline**.


---


## 👤 Author

* **Farahdini Binti Mohd Azizi** (TP071723)

* **Course**: BSc (Hons) in Computer Science (Cyber Security) – Asia Pacific University (APU)

* **Supervisor**: Mr. Mohd Hanis Bin Jenalis
