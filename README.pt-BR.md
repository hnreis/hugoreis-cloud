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
## 🚀 Esteira Automatizada de CI/CD (GitHub Actions)
A cada commit enviado para a branch main, a esteira executa o ciclo completo de entrega contínua sem tempo de inatividade (Zero Downtime):
```mermaid
flowchart TD
    Dev["👨‍💻 Engenheiro (Hugo Reis)"] -->|"git push origin main"| GH["🐙 GitHub Actions Pipeline"]

    subgraph CI ["Integração Contínua (CI)"]
        direction TB
        Checkout["1. Checkout do Código-Fonte"] --> QEMU["2. Configuração QEMU & Docker Buildx"] --> Build["3. Compilação Nativa ARM64 (Ampere A1)"] --> Push["4. Publicação no OCI Registry (ord.ocir.io)<br/>• Tag Imutável Git SHA<br/>• Tag :latest"]
    end

    subgraph CD ["Entrega Contínua (CD)"]
        direction TB
        Auth["5. Autenticação OCI CLI (Chave de API)"] --> Kube["6. Kubeconfig Dinâmico do OKE"] --> Deploy["7. kubectl set image (hugoreis-app)"] --> Rollout["8. Checagem de Saúde & Validação Zero Downtime"]
    end

    GH --> CI
    CI --> CD
    CD -->|"Carga de Trabalho Atualizada com Sucesso"| OKE[("☸️ Cluster OKE em Produção")]

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
## 🛡️ Pilares Centrais de Segurança & Engenharia (Zero Trust)
1. Mascaramento de Origem e Anti-WAF Bypass
- Nuvem Laranja da Cloudflare: O IP público de origem do Load Balancer da Oracle permanece estritamente oculto. Todas as consultas DNS externas resolvem exclusivamente os endereços Anycast da Cloudflare.
- Firewall Perimetral Restritivo: A porta 443 da Sub-rede Pública autoriza conexões originadas estritamente dos 15 blocos CIDR oficiais da Cloudflare. Varreduras automatizadas e tentativas de acesso direto ao IP de origem são descartadas no perímetro.

2. Isolamento de Computação em Sub-rede Privada
- Os nós de trabalho do Kubernetes residem em uma sub-rede privada (10.0.2.0/24) sem IPs públicos atribuídos.
- O tráfego de saída utiliza um NAT Gateway dedicado (unidirecional, apenas saída), e os downloads de contêineres do OCI Registry (OCIR) trafegam internamente pela rede da Oracle através de um Service Gateway.

---
## 👨‍💻 Autor
## Hugo Reis
Cloud Infrastructure & Network Security Engineer

- 💼 LinkedIn: linkedin.com/in/hugo-nogueira-dos-reis
- 🌐 Portfólio: hugoreis.cloud
