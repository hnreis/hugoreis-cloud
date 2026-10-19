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
