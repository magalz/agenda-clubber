---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics"]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/architecture.md", "_bmad-output/planning-artifacts/ux-design-specification.md"]
---

# Agenda Clubber - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Agenda Clubber, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Usuários podem se cadastrar como Artista, Coletivo ou ambos, com aceite obrigatório de Termos de Uso e Confidencialidade.
FR2: Administradores podem aprovar/reprovar cadastros via Dashboard.
FR3: Administradores do Coletivo podem convidar membros via e-mail.
FR4: O sistema deve restringir planejamento a coletivos aprovados.
FR5: Usuários podem realizar login/logout seguro.
FR6: Coletivos podem editar seu perfil e estilos musicais.
FR7: Coletivos possuem um Dashboard privado com eventos e notificações.
FR8: Base de dados pública de Artistas exibindo perfis completos (reivindicados) ou restritos (on-the-fly).
FR9: No cadastro de artista, o sistema deve obrigar uma busca prévia para verificar se o perfil já foi criado "on-the-fly", apresentando a opção de "Claim" em vez de novo cadastro.
FR10: Busca de artistas por nome, gênero ou localidade.
FR11: Coletivos podem criar perfis de artistas "on-the-fly", mantendo apenas Nome e Localidade como dados públicos.
FR12: Artistas podem reivindicar perfis via validação administrativa.
FR13: Indexação de perfis para SEO.
FR14: Visualização de calendário consolidado.
FR15: Cadastro de eventos (data, local, gênero, line-up).
FR16: Status de evento: "Em Planejamento" ou "Confirmado".
FR17: Opção de anonimidade para local exato ou line-up em planejamento.
FR18: Sincronização em tempo real e sistema de "lock" temporário no cadastro de datas.
FR19: Usuários podem marcar um conflito como "Resolvido" (ação bilateral).
FR20 (Post-MVP): Coletivos podem ingerir dados de eventos históricos passados para alimentar o dashboard de saúde da cena.
FR21: Cálculo automático de impacto (Verde/Amarelo/Vermelho).
FR22: Exibição de justificativas para alertas Amarelos e Vermelhos.
FR23: Delay de 3 segundos para confirmação em conflitos Vermelhos com mensagem explicativa sobre consciência coletiva.
FR24: Captura automática de geolocalização e fuso horário via API de Mapas.
FR25: Envio de e-mails instantâneos para conflitos Vermelhos e Amarelos.
FR26: Notificação via WhatsApp para grupo de admins sobre cadastros pendentes (novos coletivos, novos artistas ou reivindicações).
FR27: Notificação via e-mail para artistas em perfis criados "on-the-fly".

### NonFunctional Requirements

NFR1: Performance: Cálculo de conflitos < 2 segundos.
NFR2: Performance: Reserva de datas refletida em < 5 segundos.
NFR3: Segurança: Criptografia TLS e AES-256.
NFR4: Privacidade: Dados privados de artistas "on-the-fly" são ocultados do público até a reivindicação.
NFR5: Segurança: Modelo RBAC rigoroso.
NFR6: Segurança: Registro de criação e edições de eventos (Audit Log).
NFR7: Escalabilidade: 30 coletivos inicialmente, escalando para 50+ em um ano.
NFR8: Escalabilidade: Infraestrutura dimensionada para tráfego profissional constante.
NFR9: Confiabilidade: Disponibilidade (Uptime) alvo de 99.5%.

### Additional Requirements

- **Starter Template**: Official Supabase Next.js Starter (`with-supabase`) - Story 0.
- Infrastructure: Hosting on Vercel with GitHub Actions and Supabase Branching.
- Data Architecture: Drizzle ORM (0.45.2) with PostgreSQL (Supabase) and Zod (4.3.6) for validation.
- Auth: Supabase Auth (SSR) with Next.js Middleware and RLS policies.
- Integrations: Upstash QStash for conflict notifications and Evolution API (self-hosted) for WhatsApp.
- Frontend: TanStack Query (5.99.0) for networking and Zustand (5.0.12) for Calendar logic.
- UI: Shadcn UI (Radix + Tailwind) with Geist Sans/Mono typography.
- Monitoring: Sentry integration (lib/sentry.ts).
- Testing: Vitest (4.1.4) for unit and Playwright (1.59.1) for E2E.
- Localization: Leaflet.js with CartoDB Dark Matter tiles for maps.

### UX Design Requirements

UX-DR1: Design Token Implementation: Base de cores escuras profundas (Pure Black) com contrastes em neon (Vermelho #FF0000, Verde, Amarelo).
UX-DR2: Typography Implementation: Geist Sans para interface e Geist Mono para dados técnicos.
UX-DR3: Responsive Grid Layout: Estrutura tabular rígida para o calendário e dashboards com bordas de 1px.
UX-DR4: Reactive Conflict Indicator (Semáforo): Feedback visual imediato (Verde/Amarelo/Vermelho) nos campos de Data, Gênero e Localidade.
UX-DR5: Resolution Side Panel (Sheet): Painel lateral para resolution de conflitos com botões de ação (WhatsApp/Instagram).
UX-DR6: Ethical Delay Component: Botão de confirmação com delay de 3 segundos e feedback visual de progresso para conflitos críticos.
UX-DR7: Artist Identity Card: Diferenciação visual entre perfis verificados (selo neon) e unmanaged (on-the-fly com CTA de claim).
UX-DR8: Mandatory Search Flow: Fluxo de onboarding de artistas que obriga a busca prévia para evitar duplicatas.
UX-DR9: Accessibility Standards: Ícones semânticos em indicadores de status para daltônicos e suporte ARIA completo.
UX-DR10: Command Menu (Cmd+K): Busca global de artistas e coletivos.

### FR Coverage Map

FR1: Épico 1 - Cadastro de usuários (Artista/Coletivo) e aceite de Termos
FR2: Épico 5 - Aprovação administrativa via Dashboard
FR3: Épico 5 - Convite de membros de coletivo e vínculo de acesso
FR4: Épico 5 - Restrição de planejamento a coletivos aprovados
FR5: Épico 1 - Login/Logout seguro e Middleware de proteção
FR6: Épico 5 - Edição de perfil de coletivo
FR7: Épico 5 - Dashboard privado do coletivo
FR8: Épico 2 - Base de dados pública de artistas (reivindicados vs restritos)
FR9: Épico 2 - Busca prévia obrigatória e fluxo de Claim
FR10: Épico 2 - Busca de artistas por nome/gênero/localidade
FR11: Épico 2 - Perfis de artistas "on-the-fly"
FR12: Épico 2 - Reivindicação de perfis via validação
FR13: Épico 2 - Indexação SEO de perfis
FR14: Épico 3 - Visualização de calendário consolidado
FR15: Épico 3 - Cadastro de eventos
FR16: Épico 3 - Status de evento (Planejamento/Confirmado)
FR17: Épico 3 - Anonimidade seletiva em planejamento
FR18: Épico 3 - Sincronização em tempo real e lock de datas
FR19: Épico 4 - Resolução bilateral de conflitos
FR20: Post-MVP (Despriorizado)
FR21: Épico 3 - Cálculo automático de impacto (Verde/Amarelo/Vermelho)
FR22: Épico 3 - Justificativas de alertas de conflito
FR23: Épico 3 - Delay ético de 3s para confirmação crítica
FR24: Épico 3 - Geolocalização e fuso horário automáticos
FR25: Épico 4 - E-mails instantâneos de conflito (Vermelho/Amarelo)
FR26: Épico 4 - Notificações WhatsApp Group para admins
FR27: Épico 2 - E-mail para artistas em perfis "on-the-fly"

## Epic List

### Epic 1: Fundação, Acesso e Triagem de Perfil
Estabelecendo a infraestrutura técnica e o portal de entrada da plataforma. Usuários passam por um onboarding interativo que os identifica, autentica e direciona para a jornada correta (Artista ou Produtor) com o mínimo de fricção.
**FRs covered:** FR1, FR5.

### Epic 2: Hub de Talentos e Soberania do Artista (Claim)
Foco na base de dados de artistas com fricção zero para produtores. Produtores criam perfis "on-the-fly" e artistas reivindicam seus perfis em um fluxo recompensador, assumindo o controle de seus dados e presskits.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR27.

### Epic 3: Radar de Conflitos e Motor de Planejamento (Backend-First)
O núcleo de inteligência coletiva e o calendário reativo. Produtores planejam eventos com visibilidade de riscos (Verde/Amarelo/Vermelho) via motor de regras centralizado no backend. Linguagem de "Proteção, não Censura".
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR21, FR22, FR23, FR24.

### Epic 4: Mensageria e Notificações Assíncronas (WhatsApp/Email)
Comunicação cirúrgica e resolução bilateral de conflitos. Notificações de choque crítico enviadas via Bot em background. Painel lateral de resolução com contatos diretos (WhatsApp/Instagram) para negociação.
**FRs covered:** FR19, FR25, FR26.

### Epic 5: Governança de Cena e Dashboard do Coletivo
Curadoria administrativa e gestão estratégica da equipe. Inclui o sistema de convites para novos membros e a administração de vínculos. Administradores aprovam membros para manter a integridade da base.
**FRs covered:** FR2, FR3, FR4, FR6, FR7.

---

## Epic 1: Fundação, Acesso e Triagem de Perfil

Estabelecer a infraestrutura técnica e o portal de entrada da plataforma, garantindo que o usuário seja identificado, autenticado e direcionado para a jornada correta (Artista ou Produtor) com o mínimo de fricção.

### Story 1.0: Inicialização do Projeto e Infraestrutura Base

As a developer,
I want to initialize the project with the official Supabase starter and core libraries,
So that I have a solid, standardized foundation for all subsequent features.

**Acceptance Criteria:**

**Given** the project requirements and selected tech stack
**When** I run the initialization command `npx create-next-app -e with-supabase agenda-clubber`
**Then** the project should be scaffolded with Next.js 15+ and Supabase SSR
**And** Drizzle ORM (v0.45.2) must be configured to connect to the Supabase PostgreSQL instance
**And** Tailwind CSS must include the custom design tokens (Pure Black base, Neon Red/Green/Yellow status colors)
**And** Geist Sans and Geist Mono fonts must be configured as the primary typography (UX-DR2)
**And** a basic CI/CD pipeline with GitHub Actions and Sentry monitoring must be initialized.

### Story 1.1: Cadastro Inicial e Triagem de Papel

As a new visitor,
I want to provide my basic credentials and choose my role,
So that I can be correctly routed through the system.

**Acceptance Criteria:**

**Given** a new visitor on the sign-up page
**When** they fill in: Email, Password, and Nickname ("nome que quer ser chamado")
**Then** the system must create the base `auth.user` and a `profiles` record via Drizzle
**And** they must select: "Sou Artista" or "Sou Produtor de Eventos"
**And** based on the choice, they are redirected to the specific onboarding path (Story 1.3 or 1.4).

### Story 1.2: Autenticação e Middleware de Proteção

As a registered user,
I want to log in and out securely,
So that my professional data remains private and my session is properly managed.

**Acceptance Criteria:**

**Given** a registered user with a valid email and password
**When** they enter their credentials in the login form
**Then** the system must authenticate them via Supabase Auth (SSR)
**And** a secure session cookie must be established and managed via Next.js Middleware
**And** non-authenticated users must be automatically redirected to the login page when trying to access `/dashboard` or `/admin` (FR5)
**And** the logout action must clear the session and redirect the user back to the public homepage.

### Story 1.3: Onboarding de Artista (Perfil Essencial)

As a new Artist,
I want to provide my artistic details,
So that I can be found by collectives and manage my identity.

**Acceptance Criteria:**

**Given** a user in the "Artista" path
**When** they complete the form with:
    - **Obrigatórios:** Nome Artístico, Localidade (Cidade), Estilo Principal.
    - **Opcionais:** Estilo Secundário, Foto (Upload), SoundCloud (URL), YouTube (URL), Presskit (URL), Release (PDF upload).
**Then** a search must be performed to check for existing "on-the-fly" profiles with the same name (UX-DR8)
**And** upon completion, the user record is updated and they are redirected to their private Artist Dashboard.
**And** all mandatory fields must be validated via Zod on the server.

### Story 1.4: Onboarding de Produtor (Criação de Coletivo)

As a new Producer,
I want to choose between creating a collective or waiting for an invitation,
So that I can start organizing events or join an existing team.

**Acceptance Criteria:**

**Given** a user in the "Produtor" path
**When** they are presented with the three options:
    1. **"Criar um Coletivo"**: Must provide Nome (Obrigatório), Localidade (Obrigatório), Logo (Imagem), Estilo Principal, YouTube (URL), SoundCloud (URL) and Descrição.
    2. **"Também sou Artista"**: Redirects the user to the Artist Onboarding (Story 1.3).
    3. **"Aguardar Convite / Não tomar ação"**: Displays a success message: "Seu cadastro está ativo. Se você quer gerenciar um coletivo, peça ao administrador para te adicionar via e-mail."
**Then** if a Collective is created, the record is saved in the `collectives` table and the user is linked as an admin.
**And** the user is redirected to the Collective Dashboard.

## Epic 2: Hub de Talentos e Soberania do Artista (Claim)

Foco na base de dados de artistas com fricção zero para produtores. Produtores criam perfis "on-the-fly" e artistas reivindicam seus perfis em um fluxo recompensador, assumindo o controle de seus dados e presskits.

### Story 2.1: Criação de Perfil "On-the-Fly" e Notificação (FR11, FR27)

As a Collective Admin,
I want to add an artist to my event even if they are not registered,
So that I can complete my event planning without delays.

**Acceptance Criteria:**

**Given** an admin creating an event
**When** they search for an artist and don't find them, they can "Add New Artist (Restricted)"
**Then** only "Nome Artístico" and "Localidade" are required to create the record
**And** a restricted profile is created in the `artists` table with `is_verified: false`
**And** if an email is provided, an automatic invitation is sent to the artist via email service.

### Story 2.2: Busca Global de Talentos e Cmd+K (FR10, UX-DR10)

As a user,
I want to find artists and collectives instantly from any page,
So that I can navigate the ecosystem with maximum speed.

**Acceptance Criteria:**

**Given** any page in the application
**When** I press `Cmd+K` (or `Ctrl+K`) or click the search icon
**Then** a global search modal (Shadcn Command) must open
**And** it must allow searching by Name, Genre, or City
**And** results must display the **Artist Identity Card** (UX-DR7), showing a Neon Seal for verified profiles and a "Restricted" tag for others.

### Story 2.3: Busca Obrigatória, Claim e Gestão de Privacidade (FR9, FR12)

As a new Artist,
I want to check for existing restricted profiles and complete my full profile before approval,
So that I can claim my identity and provide all verification data to the admin in a single flow.

**Acceptance Criteria:**

**Given** a user in the Artist Onboarding flow
**When** they enter their "Nome Artístico", the system must perform a background search for restricted profiles (FR9)
**Then** if a match is found, they are presented with the "Claim this Profile" option; otherwise, they proceed to "Create New"
**And** the user is allowed to complete their **FULL profile** (Photo, Social Links, Presskit, Bio) and set **Privacy Settings** (Public, Collectives Only, Private, or Ghost Mode) before submission
**And** upon submission, the profile enters a `pending_approval` state
**And** while pending, the data is visible to platform admins for verification but restricted for other users until final approval (FR12).

### Story 2.4: Perfil Público Adaptativo e SEO (FR8, FR13)

As an Artist,
I want a professional public page that respects my privacy settings,
So that I can share my work only with the intended audience.

**Acceptance Criteria:**

**Given** a public visitor accessing an artist's URL
**When** the profile is approved and NOT in "Ghost Mode"
**Then** only fields marked as "Public" are rendered (Name and Location are always public)
**And** if the profile is in "Ghost Mode", the page must return a 404 for public visitors
**And** logged-in Collective users can see fields marked as "Collectives Only".
**And** the page must include meta tags for basic SEO (FR13).

## Epic 3: Radar de Conflitos e Motor de Planejamento (Backend-First)

O núcleo de inteligência coletiva e o calendário reativo. Produtores planejam eventos com visibilidade de riscos (Verde/Amarelo/Vermelho) via motor de regras centralizado no backend. Linguagem de "Proteção, não Censura".

### Story 3.1: Grid do Calendário e Visualização de Saúde da Cena (UX-DR3)

As a Collective Producer,
I want to see a 30-day calendar grid with a color-coded "Health Pulse" for each day,
So that I can immediately identify safe windows for event planning.

**Acceptance Criteria:**

**Given** an authenticated user in the Planning Dashboard
**When** the calendar is loaded
**Then** it must display a grid (CSS Grid + Shadcn) where each day has a "Health Pulse" (Neon glow reflecting the highest conflict level of that day)
**And** the UI must follow the "Line-over-Black" aesthetic with 1px borders
**And** clicking a day must open the event list or the "Add Event" form for that specific date.

### Story 3.2: Cadastro de Evento e Geolocalização (FR15, FR24)

As a Producer,
I want to register my event with its name and location details,
So that I can automatically calculate potential conflicts.

**Acceptance Criteria:**

**Given** the "Add Event" form
**When** the user provides: **Event Name (Required)**, Date, Location, Genre and Line-up
**Then** the system must automatically fetch coordinates and timezone via Map API (Leaflet/CartoDB)
**And** changes must be synced in real-time to prevent data races between producers.

### Story 3.3: Motor de Regras Algoritmo v1.2 (FR21, FR22)

As a Producer,
I want the system to calculate the technical impact of my event automatically,
So that I can receive objective feedback on conflict levels.

**Acceptance Criteria:**

**Given** a new or edited event
**When** the backend (Edge Functions) evaluates the input
**Then** it must return **RED** if: Same genre within 3 days OR Same non-local artist within 7 days
**And** it must return **YELLOW** if: Same genre within 4-7 days OR Same non-local artist within 8-15 days
**And** it must return **GREEN** otherwise
**And** a text justification (e.g., "Conflito: Mesmo gênero em janela de 48h") must be provided.

### Story 3.4: Privacidade Granular e Status do Evento (FR16, FR17)

As a Collective Producer,
I want to control the visibility of my event data during the planning phase,
So that I can protect my strategic info until confirmation.

**Acceptance Criteria:**

**Given** an event in "Planning" status
**When** another Collective user views the calendar
**Then** by default, they see only the Genre and the "In Planning" tag (everything else is hidden)
**And** the owner can manually toggle visibility for "Event Name", "Exact Location", or "Full Line-up"
**And** all data is revealed once status changes to "Confirmed" (FR16).

### Story 3.5: Componente de Delay Ético para Conflitos Críticos (FR23, UX-DR6)

As a Producer,
I want to be warned and forced to pause when confirming a critical conflict,
So that I can reflect on the impact on the collective scene.

**Acceptance Criteria:**

**Given** an event evaluated as **RED (Critical Conflict)**
**When** the user clicks "Confirm Event"
**Then** the system must show the message: **"Confirmar evento mesmo com conflitos críticos?"**
**And** the button must enter a "Counting" state for 3 seconds with a visual progress bar (UX-DR6)
**And** the user must be able to cancel during the countdown.

## Epic 4: Mensageria e Notificações Assíncronas (WhatsApp/Email)

Garantir uma comunicação cirúrgica e facilitar a resolução bilateral de conflitos através de automações em background e canais de contato direto.

### Story 4.1: Painel Lateral de Resolução de Conflitos (Sheet) (UX-DR5)

As a Producer with a flagged conflict,
I want to access the contact details of the conflicting collective instantly,
So that I can negotiate a resolution without leaving the context of the calendar.

**Acceptance Criteria:**

**Given** an event flagged as **RED** or **YELLOW** on the calendar
**When** the user clicks on the conflict indicator
**Then** a side panel (`Sheet`) must open with details of the conflicting event (respecting current privacy toggles)
**And** it must display direct action buttons: "Chamar no WhatsApp" (deep link to `wa.me`) and "Ver Instagram" (URL link) of the collective owner
**And** it must include semantic icons for accessibility (UX-DR9).

### Story 4.2: Notificações de Conflitos via E-mail (FR25)

As a Producer with a confirmed date,
I want to be notified immediately if a new event creates a conflict with mine,
So that I can take action to protect my event's visibility.

**Acceptance Criteria:**

**Given** an event evaluated as **RED** or **YELLOW** by the engine
**When** the event is saved in the database
**Then** the system must trigger an immediate email notification to all admins of BOTH involved collectives
**And** the email must contain the event names, date, conflict level, and a direct link to the Planning Dashboard.

### Story 4.3: Notificações Admin via WhatsApp Group (FR26)

As a platform Admin,
I want to receive alerts for pending approvals in a dedicated WhatsApp group,
So that I can maintain the platform's integrity without checking the dashboard constantly.

**Acceptance Criteria:**

**Given** a new Collective registration, new Artist registration, or Profile Claim
**When** the record enters the `pending_approval` state
**Then** a notification must be sent via **Evolution API** to the configured **Admin WhatsApp Group**
**And** the message must include the type of request and a link to the Admin Dashboard
**And** the operation must be asynchronous to maintain system performance.

### Story 4.4: Sistema de Resolução Bilateral (Consenso) (FR19)

As a Producer involved in a conflict,
I want to mark a conflict as "Resolved" after a successful negotiation,
So that the calendar reflects our agreement.

**Acceptance Criteria:**

**Given** a conflict between Event A and Event B
**When** both collective owners click the "Resolvido" button in the side panel
**Then** the status of the conflict in the database must change to `consensual_agreement`
**And** the health pulse on the calendar for that specific conflict must turn **GREEN**
**And** the message **"Conflito Resolvido"** must be displayed prominently within the event details.

## Epic 5: Governança de Cena e Dashboard do Coletivo

Curadoria administrativa e gestão estratégica da equipe. Inclui o sistema de convites para novos membros e a administração de vínculos. Administradores aprovam membros para manter a integridade da base.

### Story 5.1: Dashboard Administrativo e Moderação de Cadastros (FR2, FR4)

As a Platform Admin,
I want a centralized dashboard to review pending registrations,
So that I can maintain the professional integrity and exclusivity of the platform.

**Acceptance Criteria:**

**Given** an authenticated Platform Admin
**When** they access the `/admin` dashboard
**Then** they must see a list of pending "Coletivo" registrations, "Artista" registrations, and "Profile Claims"
**And** for each item, they must be able to "Approve" or "Reject" (with an optional reason)
**And** approved collectives must immediately gain access to the Planning Calendar (FR4)
**And** rejected users must receive an automated email notification about the decision.

### Story 5.2: Convites e Gestão de Membros do Coletivo (FR3)

As a Collective Admin,
I want to invite team members via email,
So that we can collaborate on event planning.

**Acceptance Criteria:**

**Given** an authenticated Collective Admin in the "Team" settings page
**When** they enter a member's email and click "Send Invite"
**Then** an invitation email must be sent to the user with a unique registration/join link
**And** if the user is already registered, they are linked to the collective upon clicking the link
**And** if the user is not registered, they are prompted to create an account first
**And** Collective Admins must be able to revoke access for any member at any time.

### Story 5.3: Perfil e Configurações do Coletivo (FR6)

As a Collective Producer,
I want to update our collective's identity and musical focus,
So that our public profile remains accurate and professional.

**Acceptance Criteria:**

**Given** an authenticated Collective Admin
**When** they access the "Collective Settings" page
**Then** they must be able to edit: Name, Location, Logo, Description, Primary and Secondary Genres, and Social Links (YouTube/SoundCloud/Instagram)
**And** changes must be reflected immediately on their public profile page (if applicable).

### Story 5.4: Dashboard Privado do Coletivo e Notificações (FR7)

As a Collective Producer,
I want a private dashboard summarizing our activity and alerts,
So that I can manage our events and respond to conflicts efficiently.

**Acceptance Criteria:**

**Given** an authenticated Collective user
**When** they access the `/dashboard`
**Then** they must see a list of "Our Upcoming Events" with their current status (Planning/Confirmed)
**And** a "Recent Notifications" section must display alerts for new conflicts (FR25) or resolved agreements (FR19)
**And** a "Scene Health Summary" should show if there are any critical dates requiring immediate attention.
