<p align="center">
  <a href="README.md"><b>🇺🇸 English</b></a> | <a href="README.pt-BR.md"><b>🇧🇷 Português</b></a>
</p>

# Infraestrutura MultiCloud de Produção & SPA Bilíngue

<p align="center">
  <img src="https://img.shields.io/badge/Oracle_Cloud-OKE_Ampere_A1-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  <img src="https://img.shields.io/badge/Kubernetes-1.37-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Cloudflare-WAF_%26_DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Segurança-Zero_Trust-darkgreen?style=for-the-badge" alt="Zero Trust" />
</p>

---

## 🌐 Ambiente de Produção
* **Domínio Oficial:** [https://www.hugoreis.cloud](https://www.hugoreis.cloud)
* **Borda & DNS:** Borda global Cloudflare com TLS 1.3 estrito e renovação automática de certificados Let's Encrypt via cert-manager.
* **Provedor de Nuvem (Origem):** Oracle Cloud Infrastructure (OCI) — Região `us-chicago-1`.

---

## 🏛️ Topologia de Arquitetura de Nuvem

O tráfego de entrada nunca atinge as cargas de trabalho de computação diretamente. A infraestrutura adota defesa perimetral em camadas e isolamento de rede:

```mermaid
flowchart TD
    subgraph Edge ["🌐 Camada de Borda & Internet"]
        User["👤 Usuário Final / Navegador"] -->|Requisição HTTPS| CF["🟧 Cloudflare Global Edge<br/>• Proxy Ativo (Nuvem Laranja)<br/>• TLS 1.3 / HSTS Estrito<br/>• WAF & Mitigação de Bots"]
    end

    subgraph OCI ["☁️ Oracle Cloud Infrastructure (Região: us-chicago-1)"]
        subgraph VCN ["VCN: vcn-hugoreis-prod (10.0.0.0/16)"]
            IGW["🚪 Internet Gateway (IGW)"]

            subgraph SubnetPublic ["🛡️ Sub-rede Pública (10.0.1.0/24)"]
                LB["⚖️ Flexible Load Balancer<br/>[Origem Mascarada pela Cloudflare]<br/>(Restrito aos 15 CIDRs da Cloudflare)"]
            end

            subgraph SubnetPrivate ["🔒 Sub-rede Privada (10.0.2.0/24)"]
                OKE["☸️ Cluster Gerenciado OKE (Ampere A1 ARM64)<br/>• 2x Nós de Trabalho (1 OCPU / 6 GB RAM cada)<br/>• Pods Replicados da SPA (hugoreis-app)<br/>• Controlador cert-manager"]
            end

            NGW["⚡ NAT Gateway<br/>(Saída Unidirecional Segura)"]
            SGW["📦 Service Gateway<br/>(Rede Interna Oracle / OCIR)"]
        end
    end

    CF -->|"Tráfego HTTPS Inspecionado (Apenas Porta 443)"| IGW
    IGW --> LB
    LB -->|"Encaminhamento Interno NodePort"| OKE
    OKE -.->|"Atualizações do SO & Desafio DNS-01"| NGW
    OKE -.->|"Download Seguro de Imagens"| SGW
    NGW -.->|"Saída Segura"| Edge

    classDef cloudflare fill:#f38020,stroke:#d96b14,stroke-width:2px,color:#fff;
    classDef oci fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    class CF cloudflare;
    class LB,OKE,IGW,NGW,SGW oci;
    class User edge;
```
---
## 📐Blueprint Esquemático de Rede & Fronteiras de Segurança
<p align="center">
  <img src="./oci-network-topology.png" alt="Blueprint da Topologia de Rede OCI" width="800">
</p>

---
# 🛡️ hugoreis.cloud — Infraestrutura MultiCloud & DevSecOps

[![Deploy OKE](https://github.com/hnreis/hugoreis-cloud/actions/workflows/deploy.yml/badge.svg)](https://github.com/hnreis/hugoreis-cloud/actions/workflows/deploy.yml)
![DevSecOps](https://img.shields.io/badge/Security-Shift--Left-blueviolet)
![Gitleaks](https://img.shields.io/badge/Secret%20Scanning-Gitleaks-brightgreen)
![Semgrep](https://img.shields.io/badge/SAST-Semgrep%20OWASP-blue)
![Trivy](https://img.shields.io/badge/SCA%20%26%20Container-Trivy-00a896)
![K8s PSS](https://img.shields.io/badge/Pod%20Security-Restricted-success)
![Mozilla Observatory](https://img.shields.io/badge/Mozilla%20Observatory-A%2B%20(115%2F100)-success)

[🇺🇸 Switch to English](README.md) | [🌐 Aceder à Aplicação em Produção](https://www.hugoreis.cloud)

Ambiente corporativo de produção executado na **Oracle Cloud Infrastructure (OCI)** e na borda da **Cloudflare**, desenhado sob os princípios de **Zero Trust**, **Shift-Left Security** e orquestração gerenciada com **Kubernetes (OKE)** em nós nativos ARM64 (Ampere A1).

---

## 🏗️ Topologia da Esteira DevSecOps (Shift-Left Pipeline)

A esteira de integração e entrega contínua (CI/CD) valida a segurança do código, dependências e contentores antes de autorizar a implementação no cluster:

```mermaid
flowchart TD
    Dev["👨‍💻 Dev (Commit / Push)"] -->|"git push origin main"| GH["🐙 GitHub Actions (Runner CI/CD)"]

    subgraph ShiftLeft ["🛡️ 1. Security Gates (Shift-Left)"]
        direction TB
        Gitleaks["🔑 Gitleaks — Secret Scanning<br/>(Bloqueio de credenciais e chaves)"]
        Semgrep["🔍 Semgrep — SAST (OWASP Top 10)<br/>(Varredura estática de vulnerabilidades)"]
        Gitleaks --> Semgrep
    end

    subgraph CI ["📦 2. Build & Container Security"]
        direction TB
        Build["⚙️ Docker Buildx — Multi-Arch<br/>(Compilação nativa linux/arm64)"]
        Trivy["🛡️ Trivy — SCA & Container Scan<br/>(Auditoria de CVEs e dependências)"]
        Push["🚀 OCIR Push — Imutável<br/>(ord.ocir.io/axmlxl6nbuxb/hugoreis-app)"]
        Build --> Trivy --> Push
    end

    subgraph CD ["☸️ 3. Continuous Deployment (OKE)"]
        direction TB
        Auth["🔐 OCI Auth & Kubeconfig Gen<br/>(Chaves de API seguras)"]
        Deploy["🔄 kubectl set image / rollout<br/>(Atualização sem indisponibilidade)"]
        PSS["🔒 Pod Security Verification<br/>(Restricted, Non-Root, drop ALL)"]
        Auth --> Deploy --> PSS
    end

    GH --> ShiftLeft
    ShiftLeft --> CI
    CI --> CD
    CD -->|"Carga Saudável & Validada"| Prod[("🌐 hugoreis.cloud (Produção)")]

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
## 🛡️ Pilares Centrais de Segurança & Engenharia (Zero Trust)
1. Mascaramento de Origem e Anti-WAF Bypass
- Nuvem Laranja da Cloudflare: O IP público de origem do Load Balancer da Oracle permanece estritamente oculto. Todas as consultas DNS externas resolvem exclusivamente os endereços Anycast da Cloudflare.
- Firewall Perimetral Restritivo: A porta 443 da Sub-rede Pública autoriza conexões originadas estritamente dos 15 blocos CIDR oficiais da Cloudflare. Varreduras automatizadas e tentativas de acesso direto ao IP de origem são descartadas no perímetro.

2. Isolamento de Computação em Sub-rede Privada
- Os nós de trabalho do Kubernetes residem em uma sub-rede privada (10.0.2.0/24) sem IPs públicos atribuídos.
- O tráfego de saída utiliza um NAT Gateway dedicado (unidirecional, apenas saída), e os downloads de contêineres do OCI Registry (OCIR) trafegam internamente pela rede da Oracle através de um Service Gateway.
---
## ⚙️ Especificações Técnicas

| Componente | Tecnologia | Configuração / Dimensionamento |
| :--- | :--- | :--- |
| **Provedor de Nuvem** | Oracle Cloud Infrastructure (OCI) | Região `us-chicago-1` |
| **Orquestrador** | Kubernetes (OKE) | Versão: 1.37 (Control Plane Gerenciado) |
| **Nós de Computação** | Ampere A1 (ARM64) | 2 Nós (1 OCPU, 6 GB RAM cada — total de 2 OCPUs / 12 GB RAM) |
| **Balanceador** | OCI Flexible Load Balancer | Roteamento interno via NodePort |
| **Borda / DNS / WAF** | Cloudflare | Proxy Ativo + TLS 1.3 Estrito |
| **Certificados SSL** | cert-manager + Let's Encrypt | Renovação automática via DNS-01 |
| **Pipeline de CI/CD** | GitHub Actions | Compilação multi-arquitetura e deploy zero downtime |

---
## 👨‍💻 Autor
## Hugo Reis
Cloud Infrastructure & Network Security Engineer

- 💼 LinkedIn: linkedin.com/in/hugo-nogueira-dos-reis
- 🌐 Portfólio: hugoreis.cloud
