<p align="center">
  <a href="README.md"><b>🇺🇸 English</b></a> | <a href="README.pt-BR.md"><b>🇧🇷 Português</b></a>
</p>

# Production-Grade MultiCloud Infrastructure & Bilingual SPA

<p align="center">
  <img src="https://img.shields.io/badge/Oracle_Cloud-OKE_Ampere_A1-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  <img src="https://img.shields.io/badge/Kubernetes-1.37-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Cloudflare-WAF_%26_DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Security-Zero_Trust-darkgreen?style=for-the-badge" alt="Zero Trust" />
</p>

---

## 🌐 Production Environment
* **Live Domain:** [https://www.hugoreis.cloud](https://www.hugoreis.cloud)
* **Edge & DNS:** Cloudflare Edge with Strict TLS 1.3 and automated Let's Encrypt certificates via cert-manager.
* **Cloud Origin:** Oracle Cloud Infrastructure (OCI) — Region `us-chicago-1`.

---

## 🏛️ Cloud Architecture Topology

Inbound traffic never reaches compute workloads directly. The infrastructure implements multi-tiered perimeter defense and network isolation:

```mermaid
flowchart TD
    subgraph Edge ["🌐 Edge & Internet Layer"]
        User["👤 End User / Web Browser"] -->|HTTPS Request| CF["🟧 Cloudflare Global Edge<br/>• Active Proxy (Orange Cloud)<br/>• TLS 1.3 / Strict HSTS<br/>• WAF & Bot Mitigation"]
    end

    subgraph OCI ["☁️ Oracle Cloud Infrastructure (Region: us-chicago-1)"]
        subgraph VCN ["VCN: vcn-hugoreis-prod (10.0.0.0/16)"]
            IGW["🚪 Internet Gateway (IGW)"]

            subgraph SubnetPublic ["🛡️ Public Subnet (10.0.1.0/24)"]
                LB["⚖️ Flexible Load Balancer<br/>[Origin Masked by Cloudflare]<br/>(Restricted to 15 Cloudflare CIDRs)"]
            end

            subgraph SubnetPrivate ["🔒 Private Subnet (10.0.2.0/24)"]
                OKE["☸️ OKE Managed Cluster (Ampere A1 ARM64)<br/>• 2x Worker Nodes (1 OCPU / 6 GB RAM each)<br/>• Replicated SPA Pods (hugoreis-app)<br/>• cert-manager Controller"]
            end

            NGW["⚡ NAT Gateway<br/>(Secure Unidirectional Outbound)"]
            SGW["📦 Service Gateway<br/>(Private Oracle Network / OCIR)"]
        end
    end

    CF -->|"Inspected HTTPS (Port 443 Only)"| IGW
    IGW --> LB
    LB -->|"Internal NodePort Routing"| OKE
    OKE -.->|"OS Updates & ACME DNS-01"| NGW
    OKE -.->|"Private Image Pulls"| SGW
    NGW -.->|"Secure Egress"| Edge

    classDef cloudflare fill:#f38020,stroke:#d96b14,stroke-width:2px,color:#fff;
    classDef oci fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    class CF cloudflare;
    class LB,OKE,IGW,NGW,SGW oci;
    class User edge;
```
---
## 🚀 Automated CI/CD Pipeline (GitHub Actions)

Every release pushed to the main branch undergoes fully automated continuous delivery with zero downtime:

```mermaid
flowchart TD
    Dev["👨‍💻 Engineer (Hugo Reis)"] -->|"git push origin main"| GH["🐙 GitHub Actions Pipeline"]

    subgraph CI ["Continuous Integration (CI)"]
        direction TB
        Checkout["1. Source Code Checkout"] --> QEMU["2. Setup QEMU & Docker Buildx"] --> Build["3. Native ARM64 Build (Ampere A1)"] --> Push["4. Push to OCI Registry (ord.ocir.io)<br/>• Immutable Git SHA Tag<br/>• :latest Tag"]
    end

    subgraph CD ["Continuous Deployment (CD)"]
        direction TB
        Auth["5. Authenticate OCI CLI (API Key)"] --> Kube["6. Dynamic OKE Kubeconfig"] --> Deploy["7. kubectl set image (hugoreis-app)"] --> Rollout["8. Healthcheck & Zero Downtime Validation"]
    end

    GH --> CI
    CI --> CD
    CD -->|"Workload Updated Successfully"| OKE[("☸️ Production OKE Cluster")]

    classDef dev fill:#334155,stroke:#94a3b8,color:#fff;
    classDef gh fill:#2088ff,stroke:#1d4ed8,color:#fff;
    classDef steps fill:#1e293b,stroke:#38bdf8,stroke-width:1px,color:#f8fafc;
    classDef prod fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff;

    class Dev dev;
    class GH gh;
    class Checkout,QEMU,Build,Push,Auth,Kube,Deploy,Rollout steps;
    class OKE prod;
```
---
##🛡️ Core Engineering & Security Pillars (Zero Trust)

1. Origin Masking & Anti-WAF Bypass
 - Cloudflare Orange Cloud: The real origin IP of the Oracle Load Balancer is strictly masked. All external DNS queries resolve exclusively to Cloudflare Anycast IP addresses.
- Perimeter Ingress Firewall: Port 443 on the Public Subnet accepts inbound traffic strictly from Cloudflare's 15 official IPv4 CIDR blocks. Unauthenticated scans or direct-to-IP probing attempts are dropped at the edge.

2. Private Subnet Compute Isolation
- Kubernetes worker nodes reside in a dedicated private subnet (10.0.2.0/24) without public IP addresses.
- Outbound traffic uses a dedicated NAT Gateway (unidirectional outbound-only), and container pulls from OCI Registry (OCIR) travel internally across the Oracle network via a Service Gateway.
---
##⚙️Technical Specifications

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
##👨‍💻 Author
##Hugo Reis
Cloud Infrastructure & Network Security Engineer
- 💼 LinkedIn: linkedin.com/in/hugo-nogueira-dos-reis
- 🌐 Portfolio: hugoreis.cloud
