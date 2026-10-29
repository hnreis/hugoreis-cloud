<p align="center">
  <a href="README.md"><b>🇺🇸 Switch to English</b></a> | <a href="README.pt-BR.md"><b>🇧🇷 Português</b></a>
</p>

# 🛡️ hugoreis.cloud — Infraestrutura MultiCloud & DevSecOps

<p align="center">
  <img src="https://img.shields.io/badge/Oracle_Cloud-OKE_Ampere_A1-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  <img src="https://img.shields.io/badge/Kubernetes-1.37-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Cloudflare-WAF_%26_DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Segurança-Zero_Trust-darkgreen?style=for-the-badge" alt="Zero Trust" />
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

## 🌐 Ambiente de Produção
* **Domínio Oficial:** [https://www.hugoreis.cloud](https://www.hugoreis.cloud)
* **Borda & Resolução DNS:** Rede Anycast global da Cloudflare com TLS 1.3 estrito e renovação automatizada via cert-manager.
* **Provedor de Nuvem (Origem):** Oracle Cloud Infrastructure (OCI) — Região `us-chicago-1`.
* **Filosofia Arquitetural:** Zero Trust perimetral, isolamento de rede corporativa e validação de segurança contínua (Shift-Left).

---

## 🏛️ Topologia da Arquitetura de Nuvem (Zero Trust na OCI)

O tráfego externo nunca atinge os nós de computação diretamente. A infraestrutura adota isolamento em camadas com sub-redes públicas e privadas segregadas:

```mermaid
flowchart TD
    subgraph Edge ["🌐 Camada de Borda & Internet"]
        User["👤 Usuário / Navegador"] -->|Requisição HTTPS| CF["🟧 Cloudflare Global Edge<br/>• WAF Ativo (Nuvem Laranja)<br/>• TLS 1.3 / HSTS Preload<br/>• Proteção contra Bots & CSP"]
    end

    subgraph OCI ["☁️ Oracle Cloud Infrastructure (Região: us-chicago-1)"]
        subgraph VCN ["VCN: vcn-hugoreis-prod (10.0.0.0/16)"]
            IGW["🚪 Internet Gateway (IGW)"]

            subgraph SubnetPublic ["🛡️ Sub-rede Pública (10.0.1.0/24)"]
                LB["⚖️ OCI Flexible Load Balancer<br/>[Origem Mascarada pela Cloudflare]<br/>(Entrada restrita aos 15 CIDRs Cloudflare)"]
            end

            subgraph SubnetPrivate ["🔒 Sub-rede Privada (10.0.2.0/24)"]
                OKE["☸️ Cluster Gerenciado OKE (Ampere A1 ARM64)<br/>• 2x Worker Nodes (1 OCPU / 6 GB RAM cada)<br/>• Pods da Aplicação (hugoreis-app)<br/>• cert-manager (Desafio ACME DNS-01)"]
            end

            NGW["⚡ NAT Gateway<br/>(Saída Unidirecional Segura p/ Internet)"]
            SGW["📦 Service Gateway<br/>(Rede Interna OCI p/ Registro OCIR)"]
        end
    end

    CF -->|"Tráfego HTTPS Inspecionado (Apenas Porta 443)"| IGW
    IGW --> LB
    LB -->|"Encaminhamento Interno NodePort"| OKE
    OKE -.->|"Atualizações do SO & Desafio DNS-01"| NGW
    OKE -.->|"Download Seguro de Imagens sem Internet"| SGW
    NGW -.->|"Saída Segura"| Edge

    classDef cloudflare fill:#f38020,stroke:#d96b14,stroke-width:2px,color:#fff;
    classDef oci fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    class CF cloudflare;
    class LB,OKE,IGW,NGW,SGW oci;
    class User edge;
