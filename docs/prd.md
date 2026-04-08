# Product Requirements Document (PRD): agenda-clubber

> **Status:** Finalizado (Ready for Architecture)
> **Versão:** 1.0
> **Responsável:** Morgan (PM)
> **Contexto:** Plataforma de Coordenação da Cena Eletrônica (Ceará, Brasil)

## 1. Objetivos e Contexto
### Objetivos (Goals)
- Eliminar o conflito de datas e artistas ("choque de datas") entre coletivos no Ceará.
- Centralizar talentos e recursos de infraestrutura para fomentar a cena regional.
- Criar uma ferramenta de governança neutra e colaborativa para produtores.
- Proporcionar visibilidade e autogestão de press kits para artistas locais.
- Operar com custo zero inicial (Lean Architecture: Supabase + Vercel).

### Contexto (Background)
A cena eletrônica cearense sofre com a falta de comunicação centralizada, resultando em eventos sobrepostos que prejudicam a sustentabilidade financeira dos coletivos independentes. `agenda-clubber` atua como uma "Torre de Controle" B2B, permitindo a coordenação estratégica antes do anúncio público dos eventos.

### Log de Alterações (Change Log)
| Data | Versão | Descrição | Autor |
| :--- | :--- | :--- | :--- |
| 2026-04-08 | 1.0 | PRD Final consolidado com 5 Épicos | Morgan (PM) |

---

## 2. Requisitos (Requirements)
### Funcionais (Functional)
- **FR1: Autenticação Supabase:** Perfis distintos para Coletivos e Artistas.
- **FR2: Calendário Estratégico:** Cadastro de eventos com status (Ideia, Planejamento, Confirmado).
- **FR3: Níveis de Visibilidade:** Opções de reserva Anônima, Identificada ou Pública para o status "Ideia".
- **FR4: Motor de Conflitos:** Alertas de choque de Gênero/Data/Região e Artista/Data.
- **FR5: Diretório de Artistas:** Listagem pública com sistema de "Reivindicação de Perfil" (Claim).
- **FR6: Moderação de Admin:** Fluxo de aprovação de reivindicações e denúncias de fakes.
- **FR7: Diretório de Locais/Serviços:** Cadastro simplificado "on-the-fly" por coletivos.

### Não Funcionais (Non-Functional)
- **NFR1: Performance:** Carregamento < 2s em mobile 4G.
- **NFR2: Segurança (RLS):** Proteção rigorosa de dados de eventos em status "Ideia".
- **NFR3: SEO:** Perfis de artistas otimizados para busca orgânica.
- **NFR4: Custo Zero:** Arquitetura otimizada para tiers gratuitos (Supabase/Vercel).

---

## 3. Visão de Interface (UI/UX)
- **Estética:** Dark Mode industrial, "Powered by Coletivo Ignis".
- **Paradigmas:** Dashboard de controle, Alertas visuais de conflito (Amarelo/Vermelho).
- **Plataforma:** Web Responsiva (PWA).

---

## 4. Premissas Técnicas (Architecture Assumptions)
- **Stack:** Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL, Realtime).
- **Repositório:** Monorepo.
- **Segurança:** Row Level Security (RLS) no banco de dados.
- **Testes:** Foco unitário no Motor de Colisão de Datas.

---

## 5. Lista de Épicos e Histórias
### Épico 1: Fundação & Infraestrutura Core
- **H1.1:** Setup Inicial (Next.js + Supabase + Tailwind).
- **H1.2:** Schema PostgreSQL e Políticas de RLS.
- **H1.3:** Autenticação Multi-Perfil (Coletivo vs. Artista).
- **H1.4:** Gestão Básica de Perfil (Avatar/Bio).

### Épico 2: Gestão de Eventos e Motor de Conflitos
- **H2.1:** CRUD Base de Eventos.
- **H2.2:** Níveis de Visibilidade de Reserva (Anônimo/Identificado).
- **H2.3:** Motor de Conflito: Choque de Artista.
- **H2.4:** Motor de Conflito: Choque de Gênero e Região.

### Épico 3: Calendário Estratégico e Visualização da Cena
- **H3.1:** Grid View do Calendário (Mês/Semana).
- **H3.2:** Filtros de Inteligência (Gênero/Região).
- **H3.3:** Detalhes e Contato para Arbitragem.
- **H3.4:** Atualização em Tempo Real (Realtime).

### Épico 4: Diretório de Talentos e Autogestão de Artistas
- **H4.1:** Listagem Pública de Artistas.
- **H4.2:** Página de Perfil (EPK Digital) com Players Incorporados.
- **H4.3:** Fluxo de Reivindicação de Perfil (Claim).
- **H4.4:** Painel de Moderação Admin.

### Épico 5: Diretório de Recursos da Cena (Simplificado)
- **H5.1:** Cadastro Dinâmico de Locais (Venues) via Coletivos.
- **H5.2:** Indicações de Serviços e Infraestrutura (Lista Curada).
- **H5.3:** Central de Denúncias e Qualidade de Dados.

---

## 6. Próximos Passos
1. **Design de Arquitetura:** Definir schema detalhado das tabelas no Supabase.
2. **Desenvolvimento do Épico 1.**
3. **Lançamento do MVP (Beta Fechado para 15 coletivos).**

---
*Documento gerado por Morgan (PM) - Planejando o futuro da cena eletrônica.*
