---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: 'terça-feira, 14 de abril de 2026'
inputDocuments: ["_bmad-output/planning-artifacts/product-brief-agenda-clubber.md", "_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/ux-design-specification.md", "music-genres/genres.md"]
project_name: 'agenda-clubber'
user_name: 'Magal'
date: 'terça-feira, 14 de abril de 2026'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
O sistema exige uma gestão robusta de estados para o calendário e perfis de artistas. A funcionalidade de "Claim" e a criação de perfis "on-the-fly" demandam uma lógica de backend que separe claramente dados públicos de privados. A detecção de conflitos multidimensional (Algoritmo v1.2) é o componente de maior processamento lógico.

**Non-Functional Requirements:**
A latência é crítica para a experiênca reativa (cálculo < 2s). A segurança (RBAC) e a disponibilidade (99.5%) são fundamentais para manter a confiança dos produtores que inserem dados estratégicos.

**Scale & Complexity:**
O projeto é de complexidade média, focado em alta integridade de dados e coordenação comunitária.

- Primary domain: Full-stack Web (Next.js/Supabase sugerido pelo Brief)
- Complexity level: Medium
- Estimated architectural components: 8-10 (Auth, Artists Hub, Conflict Engine, Calendar, Bot Service, Admin Dashboard, Notification System, Audit Log)

### Technical Constraints & Dependencies

- Integração obrigatória com WhatsApp (via Bots).
- Dependência de API de Mapas para fuso horário e geolocalização automática.
- Uso de Shadcn UI e Geist Sans/Mono (conforme UX Spec).

### Cross-Cutting Concerns Identified

- **Data Consistency:** Reserva de datas com "lock" temporário para evitar sobreposição durante o cadastro.
- **Privacy Enforcement:** Filtros automáticos de visibilidade para perfis não reivindicados.
- **Auditing:** Registro detalhado de quem alterou o quê no calendário para resolução de disputas.

## Starter Template Evaluation

### Primary Technology Domain

Web Full-stack (SaaS Comunitário) baseado na análise de requisitos que exige alta integridade de dados, autenticação segura e feedback em tempo real.

### Starter Options Considered

- **Official Supabase Next.js Starter:** Minimalista, focado em estabilidade e integração nativa com Supabase Auth/SSR.
- **Next-shadcn-dashboard-starter:** Excelente para interfaces densas de dados, mas com maior carga inicial de componentes.
- **ChadNext:** Alternativa leve para MVPs rápidos.

### Selected Starter: Official Supabase Next.js Starter (`with-supabase`)

**Rationale for Selection:**
O Agenda Clubber possui uma lógica de domínio complexa (Algoritmo de Conflitos v1.2). Escolher um starter minimalista e oficial garante que a arquitetura seja construída de forma limpa, sem o peso morto de funcionalidades de SaaS comercial. A escolha pela hospedagem no **Vercel** complementa o stack, garantindo deploys atômicos e integração fluida com as Edge Functions do Next.js, ideais para processar webhooks dos bots de WhatsApp.

**Initialization Command:**

```bash
npx create-next-app -e with-supabase agenda-clubber
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript com Next.js 15+ e Node.js 20+. Configuração de paths absolutos (`@/*`) e strict mode ativado.

**Styling Solution:**
Tailwind CSS configurado como base para Shadcn UI, facilitando a implementação da estética "Dark Mode/Neon" solicitada no UX Spec.

**Build Tooling & Hosting:**
Turbopack otimizado para desenvolvimento rápido. Hospedagem definida no **Vercel** para aproveitar a infraestrutura de Edge e CI/CD integrada.

**Testing Framework:**
Não incluso por padrão, exigirá decisão manual no Step 4 (sugestão: Vitest + Playwright).

**Code Organization:**
Estrutura App Router, com separação clara de `app/`, `components/`, `utils/` e `lib/` para o cliente Supabase.

**Development Experience:**
Hot reloading nativo, integração com Supabase CLI e preview deployments automáticos no Vercel para cada Pull Request.

**Note:** A inicialização do projeto usando este comando deve ser a primeira história de implementação (Story 0).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
Uso de Drizzle ORM sobre Edge Functions do Vercel e integração nativa do Supabase Branching para CI/CD.

**Important Decisions (Shape Architecture):**
Adoção do Zod v4 para validação ultra-rápida e MSW para mock de serviços externos (WhatsApp/Upstash) nos testes.

**Deferred Decisions (Post-MVP):**
Estratégia de caching avançado com Redis/Upstash (avaliar após as primeiras métricas de carga).

### Data Architecture

**ORM & DB Client:**
Drizzle ORM (`0.45.2`) para comunicação com PostgreSQL (Supabase). Escolhido pela performance em Edge e "SQL-first" approach.
**Validation:**
Zod (`4.3.6`) para garantir integridade de dados do "on-the-fly" até o "Claim".

### Authentication & Security

**Auth Method:**
Supabase Auth (SSR) com Middleware do Next.js.
**Security Pattern:**
Row Level Security (RLS) no PostgreSQL como última linha de defesa, complementado por Server Actions validados com Zod.

### API & Communication Patterns

**Webhooks & Queues:**
Integração com bots de WhatsApp via API Routes (Vercel Edge) e **Upstash QStash** para garantir a entrega de notificações críticas de conflito.

### Frontend Architecture

**State Management:**
TanStack Query (`5.99.0`) para dados de rede e Zustand (`5.0.12`) para a complexa lógica visual do Calendário.
**Component UI:**
Shadcn UI (Radix + Tailwind) para garantir acessibilidade e estética Dark/Neon.

### Infrastructure & Deployment

**Hosting & CI/CD:**
Hospedagem no **Vercel** com integração nativa ao **GitHub Actions**. Uso de **Supabase Branching** para ambientes de preview por Pull Request.
**Automated Testing:**
Vitest (`4.1.4`) para unidade e Playwright (`1.59.1`) para E2E, rodando inteiramente no servidor (GitHub Actions) contra URLs de preview.

### Decision Impact Analysis

**Implementation Sequence:**
1. Setup de Infra (Vercel + Supabase Branching).
2. Story 0: Inicialização do Starter e Drizzle.
3. Story 1: Fluxo de Auth e RBAC.
4. Story 2: Lógica do Algoritmo de Conflitos v1.2.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 áreas críticas onde agentes de IA poderiam divergir: Nomenclatura (DB vs Código), Localização de Testes, Estrutura de Resposta de API, Validação de Dados e Gestão de Estados de Carregamento.

### Naming Patterns

**Database Naming Conventions (PostgreSQL/Drizzle):**
- **Tabelas:** `snake_case` e **plural**. Ex: `users`, `event_logs`, `artist_claims`.
- **Colunas:** `snake_case`. Ex: `created_at`, `is_verified`, `coletivo_id`.

**API Naming Conventions (JSON):**
- **Campos:** `camelCase`. Ex: `{ eventId: 1, conflictLevel: 'high' }`.
- **Rotas:** `kebab-case`. Ex: `/api/v1/artist-search`.

**Code Naming Conventions (TypeScript/React):**
- **Componentes:** `PascalCase`. Ex: `ConflictRadar.tsx`.
- **Arquivos:** `PascalCase.tsx` para componentes, `kebab-case.ts` para utilitários/hooks.
- **Variáveis/Funções:** `camelCase`. Ex: `const [isPending, setIsPending] = ...`.

### Structure Patterns

**Project Organization:**
- **Feature-based:** Componentes e hooks agrupados por domínio. Ex: `src/features/calendar/`, `src/features/artists/`.
- **Shared UI:** Componentes básicos do Shadcn em `src/components/ui/`.

**File Structure Patterns:**
- **Testes Unitários/Integração:** Co-localizados. Ex: `calculate-conflict.ts` e `calculate-conflict.test.ts`.
- **Testes E2E:** Pasta raiz `/tests/e2e/`.

### Format Patterns

**API Response Formats:**
- **Wrapper Padrão:** Todas as respostas de API e Server Actions devem seguir o formato:
  `{ data: T | null, error: { message: string, code: string } | null }`.

**Data Exchange Formats:**
- **Datas:** Sempre ISO 8601 strings em UTC para trânsito de dados.
- **Booleans:** `true/false` nativos do JS/PG.

### Communication Patterns

**State Management Patterns (Zustand):**
- **Single Source of Truth:** O estado do calendário deve ser centralizado no store do Zustand, usando `useShallow` para otimização de re-render.

### Process Patterns

**Error Handling & Validation:**
- **Zod-First:** Nenhuma Server Action ou API Route deve processar dados sem validação prévia via `zod.parse()` ou `zod.safeParse()`.
- **Graceful Failures:** Uso de `error.tsx` do Next.js para capturar falhas inesperadas e exibir feedback amigável.

### Enforcement Guidelines

**All AI Agents MUST:**
- Usar o mapeamento do Drizzle (`columnName: text("column_name")`) para manter o código em `camelCase` enquanto o DB permanece em `snake_case`.
- Implementar `loading.tsx` com Skeletons para cada rota principal.
- Adicionar comentários JSDoc em funções complexas da lógica de conflito (Algoritmo v1.2).

### Pattern Examples

**Good Examples:**
- `db.select().from(events).where(eq(events.id, id))`
- `export function ConflictAlert({ level }: { level: 'red' | 'yellow' }) { ... }`

**Anti-Patterns:**
- Tabelas no singular (`user`) ou colunas em `camelCase` (`userId`) no banco de dados.
- Lógica de negócio pesada dentro de componentes de UI (deve ir para `utils/` ou `features/`).

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
agenda-clubber/
├── .github/
│   └── workflows/
│       └── ci.yml             # Lint, Vitest, Playwright (Vercel Preview)
├── drizzle/                   # Migrations geradas pelo drizzle-kit
├── public/                    # Assets estáticos
├── tests/
│   └── e2e/                   # Playwright E2E tests
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Rotas de login/cadastro
│   │   ├── (dashboard)/       # Dashboard do Coletivo e Calendário
│   │   ├── admin/             # Painel administrativo
│   │   ├── api/
│   │   │   └── webhooks/      # Recebimento de dados do WhatsApp/QStash
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home pública (Fase 2)
│   ├── components/
│   │   ├── ui/                # Shadcn UI (Componentes base)
│   │   └── shared/            # Componentes reutilizáveis entre features
│   ├── features/              # Lógica de domínio (Server Actions, Stores, Hooks)
│   │   ├── auth/
│   │   ├── artists/           # Hub, Claim, Busca
│   │   ├── calendar/          # Algoritmo v1.2, Grid do calendário
│   │   └── admin/             # Aprovações e Logs
│   ├── db/                    # Configuração Drizzle e Schemas
│   │   ├── schema/            # Definição de tabelas por domínio
│   │   └── index.ts           # Cliente DB
│   ├── lib/                   # Clientes de terceiros (Supabase, QStash, Sentry)
│   ├── hooks/                 # Hooks globais
│   ├── utils/                 # Helpers genéricos
│   ├── types/                 # Tipos TS globais
│   └── middleware.ts          # Proteção de rotas e RBAC
├── .env.example
├── drizzle.config.ts          # Configuração do Drizzle Kit
├── next.config.ts
├── package.json
└── tailwind.config.ts
```

### Architectural Boundaries

**API Boundaries:**
- **Public API:** Rotas expostas em `app/api/` para webhooks (WhatsApp). Proteção via QStash signatures.
- **Server Actions:** Fronteira principal entre UI e DB, validadas com Zod.

**Component Boundaries:**
- **Feature Components:** Componentes inteligentes em `features/` que consomem stores e actions.
- **UI Components:** Componentes burros em `components/ui/` (Shadcn), sem lógica de negócio.

**Service Boundaries:**
- **Conflict Engine:** Lógica do Algoritmo v1.2 isolada em `features/calendar/logic/`, testável independentemente da UI.

**Data Boundaries:**
- **RLS Policy:** Segurança de dados via Row Level Security do Supabase, garantindo que um coletivo não leia dados de planejamento de outro sem permissão.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Gestão de Identidade:** `src/features/auth/`
- **Hub de Artistas:** `src/features/artists/`
- **Calendário de Planejamento:** `src/features/calendar/`
- **Painel Administrativo:** `src/app/admin/`

**Cross-Cutting Concerns:**
- **Segurança (RBAC):** `middleware.ts` e `src/features/auth/`.
- **Notificações:** `src/lib/qstash.ts` e `src/app/api/webhooks/`.
- **Logging/Sentry:** `src/lib/sentry.ts`.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Todas as tecnologias (Next.js, Supabase, Drizzle, Vercel) são compatíveis e otimizadas para o modelo "Serverless/Edge". O stack prioriza ferramentas **Open Source** (Leaflet, Evolution API, Drizzle) e soberania digital.

**Pattern Consistency:**
Os padrões de nomenclatura e a estrutura baseada em features garantem uma base de código previsível. O uso de `snake_case` no DB e `camelCase` no código é mediado de forma transparente pelo Drizzle.

**Structure Alignment:**
A estrutura de diretórios isola a lógica crítica de conflitos (Conflict Engine) da interface, permitindo testes de unidade robustos.

### Requirements Coverage Validation ✅

**Feature/Epic Coverage:**
- **Gestão de Datas:** Dashboard customizado (CSS Grid/Tailwind) com lógica de conflito isolada.
- **Hub de Artistas:** Uso de **Leaflet/OSM** para geolocalização open-source.
- **Mensageria:** **Evolution API** auto-hospedada para notificações de WhatsApp sem custos de licenciamento.

**Non-Functional Requirements Coverage:**
Performance via Edge Functions; Segurança via RLS; Custo operacional próximo de zero via ferramentas auto-hospedadas e open-source.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Decisões críticas (ORM, Auth, Hosting, Testes, Mapas, Bots) estão documentadas com versões e justificativas filosóficas (OSS-First).

**Structure Completeness:**
Árvore de diretórios completa e mapeada para os requisitos funcionais.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (OSS Priority)
- [x] Integration patterns defined (Webhooks + QStash)
- [x] Performance considerations addressed (Edge/Drizzle)

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined (Feature-based)
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Gap Analysis & Resolutions (Open Source First)

**Gap 1: Calendário Reativo**
- **Resolução:** Dashboard customizado usando **CSS Grid + Tailwind CSS** + `react-day-picker` (Headless/MIT). Máxima flexibilidade visual (Neon) e performance.

**Gap 2: Localidade & Mapas**
- **Resolução:** **Leaflet.js** com tiles **CartoDB Dark Matter** (OpenStreetMap). Gratuito, soberano e altamente customizável visualmente.

**Gap 3: Motor de Mensageria (WhatsApp)**
- **Resolução:** **Evolution API v2** (Auto-hospedada via Docker). Padrão ouro open-source para integração programática com WhatsApp sem mensalidades.

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH (Especialmente pela robustez do stack Open Source escolhido).

### Implementation Handoff

**AI Agent Guidelines:**
- Siga as decisões do Drizzle ORM e Zod rigorosamente.
- Mantenha a lógica de domínio em `src/features/`.
- Respeite as RLS Policies do Supabase.
- Priorize implementações que mantenham a soberania digital e o baixo custo operacional.

**First Implementation Priority:**
Executar o comando de inicialização: `npx create-next-app -e with-supabase agenda-clubber` e configurar o Drizzle Kit.
