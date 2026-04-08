# Fullstack Architecture: agenda-clubber

> **Status:** Ready for Implementation
> **Versão:** 1.0
> **Responsável:** Aria (Architect)
> **Stack Principal:** Next.js + Supabase + Tailwind CSS

## 1. Visão Geral Técnica
O `agenda-clubber` utiliza uma arquitetura **Serverless Fullstack** baseada em um Monorepo. A interface é construída com **Next.js (App Router)** e a infraestrutura de backend é delegada ao **Supabase (BaaS)**, utilizando **PostgreSQL** para garantir a integridade relacional necessária para a detecção de conflitos de datas e artistas.

## 2. Infraestrutura e Plataforma
- **Hospedagem Frontend:** Vercel (Global Edge).
- **Backend & Database:** Supabase (Região: `sa-east-1` - São Paulo).
- **Serviços Core:** Supabase Auth, PostgreSQL, Storage (Imagens), Realtime (Atualizações do Calendário).
- **Repositório:** Monorepo (npm workspaces).

## 3. Modelo de Dados (Schema SQL)
O coração do sistema reside no PostgreSQL, com segurança garantida por **Row Level Security (RLS)**:
- `profiles`: Extensão de `auth.users` para perfis de Coletivos e Artistas.
- `collectives`: Dados específicos dos núcleos organizadores.
- `artists`: Talentos da cena (incluindo perfis órfãos para reivindicação).
- `locations`: Venues e espaços de eventos.
- `events`: Registro de intenções com controle de visibilidade (Privado/Público).
- `event_artists`: Relacionamento muitos-para-muitos entre eventos e artistas.

## 4. Arquitetura Frontend (Next.js)
Organizada via **Route Groups** e **Server Actions**:
- `(auth)`: Fluxos de login e registro.
- `(dashboard)`: Área logada para Coletivos gerenciarem eventos.
- `(public)`: Portal de Artistas e Calendário estratégico.
- **Shared Logic:** Pacote `packages/shared` contendo o **Conflict Engine** em TypeScript, garantindo que a validação no frontend coincida com a do servidor.

## 5. Estrutura do Monorepo
```plaintext
agenda-clubber/
├── apps/web/               # Next.js Application
├── packages/shared/        # Conflict Engine & Types
├── supabase/migrations/    # SQL Schema & RLS Policies
└── docs/                   # PRD, Brief, Architecture
```

## 6. Fluxo de Deploy e CI/CD
- **CI:** GitHub Actions para Lint, Type Check e Vitest.
- **CD:** Vercel Previews para cada Pull Request; Deploy automático na `main` para Produção.
- **Database Migrations:** Gerenciadas via Supabase CLI para garantir paridade entre ambientes.

## 7. Regras Críticas de Desenvolvimento
- **Type Safety:** Sempre usar tipos compartilhados de `packages/shared`.
- **Security First:** RLS obrigatório em todas as tabelas.
- **Validation:** Zod para validação de esquemas em Forms e Server Actions.
- **Performance:** Imagens otimizadas no Storage e Next.js Image.

---
*Arquitetura concebida para a sustentabilidade da cena eletrônica cearense.*
