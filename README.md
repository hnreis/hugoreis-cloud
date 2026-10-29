<p align="center">
  <a href="README.md"><b>🇺🇸 English</b></a> | <a href="README.pt-BR.md"><b>🇧🇷 Switch to Portuguese</b></a>
</p>

# 🛡️ hugoreis.cloud — MultiCloud Infrastructure & DevSecOps

<p align="center">
  <img src="https://img.shields.io/badge/Oracle_Cloud-OKE_Ampere_A1-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  <img src="https://img.shields.io/badge/Kubernetes-1.37-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Cloudflare-WAF_%26_DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Security-Zero_Trust-darkgreen?style=for-the-badge" alt="Zero Trust" />
</p>

<p align="center">
  <a href="https://github.com/hnreis/hugoreis-cloud/actions/workflows/deploy.yml"><img src="https://github.com/hnreis/hugoreis-cloud/actions/workflows/deploy.yml/badge.svg" alt="Deploy OKE" /></a>
  <img src="https://img.shields.io/badge/Security-Shift--Left-blueviolet" alt="DevSecOps Shift-Left" />
  <img src="https://img.shields.io/badge/Secret%20Scanning-Gitleaks-brightgreen" alt="Gitleaks" />
  <img src="https://img.shields.io/badge/SAST-Semgrep%20OWASP-blue" alt="Semgrep" />
  <img src="https://img.shields.io/badge/SCA%20%26%20Container-Trivy-00a896" alt="Trivy" />
  <img src="https://img.shields.io/badge/Pod%20Security-Restricted-success" alt="K8s PSS" />
  <img src="https://img.shields.io/badge/Mozilla_Observatory-A%2B%20(115%2F100)-success" alt="Mozilla Observatory" />
</p>

---

## 🌐 Production Environment
* **Live Domain:** [https://www.hugoreis.cloud](https://www.hugoreis.cloud)
* **Edge & DNS Resolution:** Cloudflare Global Anycast Edge with Strict TLS 1.3 and automated ACME renewal via cert-manager.
* **Cloud Origin:** Oracle Cloud Infrastructure (OCI) — Region `us-chicago-1`.
* **Architectural Philosophy:** Perimeter Zero Trust, corporate network isolation, and automated Shift-Left security validation.

---

## 🏛️ Cloud Architecture Topology (Zero Trust on OCI)

Inbound traffic never reaches compute workloads directly. The infrastructure implements multi-tiered defense and network segmentation across public and private subnets:

```mermaid
flowchart TD
    subgraph Edge ["🌐 Edge & Internet Layer"]
        User["👤 End User / Web Browser"] -->|HTTPS Request| CF["🟧 Cloudflare Global Edge<br/>• Active WAF (Orange Cloud)<br/>• TLS 1.3 / Strict HSTS<br/>• Bot Mitigation & Strict CSP"]
    end

    subgraph OCI ["☁️ Oracle Cloud Infrastructure (Region: us-chicago-1)"]
        subgraph VCN ["VCN: vcn-hugoreis-prod (10.0.0.0/16)"]
            IGW["🚪 Internet Gateway (IGW)"]

            subgraph SubnetPublic ["🛡️ Public Subnet (10.0.1.0/24)"]
                LB["⚖️ OCI Flexible Load Balancer<br/>[Origin Masked by Cloudflare]<br/>(Restricted to 15 Cloudflare CIDRs)"]
            end

            subgraph SubnetPrivate ["🔒 Private Subnet (10.0.2.0/24)"]
                OKE["☸️ Managed OKE Cluster (Ampere A1 ARM64)<br/>• 2x Worker Nodes (1 OCPU / 6 GB RAM each)<br/>• Replicated Application Pods (hugoreis-app)<br/>• cert-manager (ACME DNS-01 Challenge)"]
            end

            NGW["⚡ NAT Gateway<br/>(Secure Outbound Egress to Internet)"]
            SGW["📦 Service Gateway<br/>(Private OCI Backbone to OCIR Registry)"]
        end
    end

    CF -->|"Inspected HTTPS Traffic (Port 443 Only)"| IGW
    IGW --> LB
    LB -->|"Internal NodePort Routing"| OKE
    OKE -.->|"OS Updates & DNS-01 Validation"| NGW
    OKE -.->|"Private Image Pulls (Zero Internet)"| SGW
    NGW -.->|"Secure Egress"| Edge

    classDef cloudflare fill:#f38020,stroke:#d96b14,stroke-width:2px,color:#fff;
    classDef oci fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    class CF cloudflare;
    class LB,OKE,IGW,NGW,SGW oci;
    class User edge;

```
📐 Network Topology Blueprint
---
## ⚙️ Technical Specifications

| Component | Technology | Configuration / Sizing |
| :--- | :--- | :--- |
| **Cloud Provider** | Oracle Cloud Infrastructure (OCI) | Region: `us-chicago-1` |
| **Orchestrator** | Kubernetes (OKE) | Version: 1.37 (Managed Control Plane) |
| **Compute Nodes** | Ampere A1 (ARM64) | 2 Nodes (1 OCPU, 6 GB RAM each — 2 OCPUs / 12 GB RAM total) |
| **Load Balancer** | OCI Flexible Load Balancer | Internal NodePort routing |
| **Edge / DNS / WAF** | Cloudflare | Active Proxy + Strict TLS 1.3 |
| **SSL Certificates** | cert-manager + Let's Encrypt | Automated renewal via DNS-01 |
| **CI/CD Pipeline** | GitHub Actions | Multi-arch build and zero-downtime deployment |
---
## 🏗️ DevSecOps Delivery Pipeline (Shift-Left CI/CD)
The continuous integration and delivery pipeline automatically enforces security gates across source code, third-party packages, and container images prior to cluster deployment:

```mermaid
flowchart TD
    Dev["👨‍💻 Developer (Commit / Push)"] -->|"git push origin main"| GH["🐙 GitHub Actions (CI/CD Runner)"]

    subgraph ShiftLeft ["🛡️ 1. Security Gates (Shift-Left)"]
        direction TB
        Gitleaks["🔑 Gitleaks — Secret Scanning<br/>(Automated credentials & token gate)"]
        Semgrep["🔍 Semgrep — SAST (OWASP Top 10)<br/>(Static application security scanning)"]
        Gitleaks --> Semgrep
    end

    subgraph CI ["📦 2. Build & Container Security"]
        direction TB
        Build["⚙️ Docker Buildx — Multi-Arch<br/>(Native linux/arm64 build)"]
        Trivy["🛡️ Trivy CLI — SCA & Container Scan<br/>(CVE audit & dependency check)"]
        Push["🚀 OCIR Push — Immutable Digest<br/>(ord.ocir.io/axmlxl6nbuxb/hugoreis-app)"]
        Build --> Trivy --> Push
    end

    subgraph CD ["☸️ 3. Continuous Deployment (OKE)"]
        direction TB
        Auth["🔐 OCI Auth & Kubeconfig Gen<br/>(Secure API key exchange)"]
        Deploy["🔄 kubectl rollout / rolling update<br/>(Zero-downtime workload release)"]
        PSS["🔒 Pod Security Verification<br/>(Restricted, Non-Root, drop ALL)"]
        Auth --> Deploy --> PSS
    end

    GH --> ShiftLeft
    ShiftLeft --> CI
    CI --> CD
    CD -->|"Healthy & Verified Workload"| Prod[("🌐 hugoreis.cloud (Live Production)")]

    classDef dev fill:#334155,stroke:#94a3b8,color:#fff;
    classDef gh fill:#2088ff,stroke:#1d4ed8,color:#fff;
    classDef sec fill:#4c1d95,stroke:#8b5cf6,stroke-width:1px,color:#fff;
    classDef ci fill:#1e293b,stroke:#38bdf8,stroke-width:1px,color:#fff;
    classDef cd fill:#065f46,stroke:#10b981,stroke-width:1px,color:#fff;
    classDef prod fill:#047857,stroke:#34d399,stroke-width:2px,color:#fff;

    class Dev dev;
    class GH gh;
    class Gitleaks,Semgrep sec;
    class Build,Trivy,Push ci;
    class Auth,Deploy,PSS cd;
    class Prod prod;
```
---
## 👨‍💻 Author: Hugo Reis
Cloud Infrastructure & Network Security Engineer

- 💼 LinkedIn: linkedin.com/in/hugo-nogueira-dos-reis
- 🌐 Portfolio: hugoreis.cloud
- 🐙 GitHub: github.com/hnreis
