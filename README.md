# Production MultiCloud Architecture & Bilingual SPA

<p align="center">
  <img src="https://img.shields.io/badge/Oracle_Cloud-OKE_Ampere_A1-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  <img src="https://img.shields.io/badge/Kubernetes-1.31-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Cloudflare-WAF_%26_DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Security-Zero_Trust-darkgreen?style=for-the-badge" alt="Zero Trust" />
</p>

---

## 🌐 Endereço de Produção
* **Domínio Oficial:** [https://hugoreis.cloud](https://hugoreis.cloud)
* **Borda & DNS:** Cloudflare Edge com TLS 1.3 estrito e renovação automática via cert-manager.
* **Provedor de Nuvem (Origem):** Oracle Cloud Infrastructure (OCI) — Região `us-chicago-1`.

---

## 🏛️ Topologia de Arquitetura de Nuvem

O tráfego de usuários não acessa os servidores de computação diretamente. A infraestrutura adota isolamento perimetral em camadas:

```mermaid
flowchart TD
    subgraph Edge ["🌐 Camada de Borda & Internet"]
        User["👤 Usuário / Navegador"] -->|Requisição HTTPS| CF["🟧 Cloudflare Global Edge<br/>• WAF Ativo (Nuvem Laranja)<br/>• TLS 1.3 / HSTS Preload<br/>• Proteção contra Bots"]
    end

    subgraph OCI ["☁️ Oracle Cloud Infrastructure (Região us-chicago-1)"]
        subgraph VCN ["VCN: vcn-hugoreis-prod (10.0.0.0/16)"]
            IGW["🚪 Internet Gateway (IGW)"]

            subgraph SubnetPublic ["🛡️ Sub-rede Pública (10.0.1.0/24)"]
                LB["⚖️ Flexible Load Balancer<br/>[Origem Protegida por Proxy]<br/>(Filtrado p/ 15 blocos Cloudflare)"]
            end

            subgraph SubnetPrivate ["🔒 Sub-rede Privada (10.0.2.0/24)"]
                OKE["☸️ Cluster OKE (Ampere A1 ARM64)<br/>• Pods SPA (hugoreis-app)<br/>• cert-manager (Let's Encrypt)"]
            end

            NGW["⚡ NAT Gateway<br/>(Saída Unidirecional de Internet)"]
            SGW["📦 Service Gateway<br/>(Rede Interna OCI / OCIR)"]
        end
    end

    CF -->|"Apenas Tráfego Inspecionado (HTTPS 443)"| IGW
    IGW --> LB
    LB -->|"Encaminhamento Interno (NodePort)"| OKE
    OKE -.->|"Updates & Validação ACME"| NGW
    OKE -.->|"Download de Imagens sem Internet"| SGW
    NGW -.->|"Saída Segura"| Edge

    classDef cloudflare fill:#f38020,stroke:#d96b14,stroke-width:2px,color:#fff;
    classDef oci fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#f8fafc;
    class CF cloudflare;
    class LB,OKE,IGW,NGW,SGW oci;
    class User edge;
```
---

🚀 Esteira Automatizada de CI/CD (GitHub Actions)

A cada integração na branch main, o pipeline executa o ciclo completo de entrega contínua em formato vertical sem intervenção manual:

```mermaid
flowchart TD
    Dev["👨‍💻 Dev (Hugo)"] -->|"git push origin main"| GH["🐙 GitHub Actions"]

    subgraph CI ["Integração Contínua (CI)"]
        direction TB
        Checkout["1. Checkout do Código"] --> QEMU["2. Configuração QEMU & Buildx"] --> Build["3. Build Nativo ARM64 (Ampere A1)"] --> Push["4. Push no OCIR (ord.ocir.io)<br/>• Tag Git SHA<br/>• Tag :latest"]
    end

    subgraph CD ["Entrega Contínua (CD)"]
        direction TB
        Auth["5. Autenticação OCI CLI"] --> Kube["6. Kubeconfig Dinâmico OKE"] --> Deploy["7. kubectl set image (hugoreis-app)"] --> Rollout["8. Validação de Saúde (Zero Downtime)"]
    end

    GH --> CI
    CI --> CD
    CD -->|"Workload Atualizado com Sucesso"| OKE[("☸️ Cluster OKE em Produção")]

    classDef dev fill:#334155,stroke:#94a3b8,color:#fff;
    classDef gh fill:#2088ff,stroke:#1d4ed8,color:#fff;
    classDef steps fill:#1e293b,stroke:#38bdf8,stroke-width:1px,color:#f8fafc;
    classDef prod fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff;

    class Dev dev;
    class GH gh;
    class Checkout,QEMU,Build,Push,Auth,Kube,Deploy,Rollout steps;
    class OKE prod;
