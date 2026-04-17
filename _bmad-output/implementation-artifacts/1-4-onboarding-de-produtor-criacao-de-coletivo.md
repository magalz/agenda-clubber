# Story 1.4: Onboarding de Produtor (Criação de Coletivo)

Status: done

## Story

As a new Producer,
I want to choose between creating a collective or waiting for an invitation,
so that I can start organizing events or join an existing team.

## Acceptance Criteria

1. **Onboarding Options:** The user must be presented with three clear paths:
    - **Path A: "Criar um Coletivo"**: A form to register a new collective.
    - **Path B: "Também sou Artista"**: Redirect to Artist Onboarding (Story 1.3).
    - **Path C: "Aguardar Convite"**: A simple confirmation and informational message.
2. **Collective Creation Form (Path A):**
    - **Obrigatórios:** Nome do Coletivo, Localidade (Cidade), Estilo Principal.
    - **Opcionais:** Logo (Upload), Descrição, Estilo Secundário, YouTube (URL), SoundCloud (URL), Instagram (URL).
3. **Data Persistence:**
    - New collectives must be saved in the `collectives` table.
    - The user's `profile_id` must be linked to the collective with the role of `collective_admin`.
4. **Approval State:** Newly created collectives must enter a `pending_approval` state (FR2, FR4).
5. **Redirection:**
    - Path A: Redirect to Collective Dashboard (`/dashboard/collective`) with a "Pending Approval" banner.
    - Path C: Redirect to a landing/waiting page with instructions.
6. **Validation:** Server-side validation with Zod for all form fields and file uploads.

## Tasks / Subtasks

- [x] **Database Schema (AC: 3)**
  - [x] Define `collectives` table in `src/db/schema/collectives.ts` (id, name, location, logo_url, description, genres, social_links, status, created_at).
  - [x] Define `collective_members` table (id, collective_id, profile_id, role, joined_at) to manage the link.
  - [x] Generate and run migrations.
- [x] **UI Implementation (AC: 1, 2)**
  - [x] Create Producer Onboarding selector page: `src/app/(dashboard)/onboarding/producer/page.tsx`.
  - [x] Implement the "Create Collective" form using Shadcn UI.
  - [x] Implement logo upload to Supabase Storage.
- [x] **Server Actions (AC: 3, 4, 6)**
  - [x] Create `createCollectiveAction` in `src/features/collectives/actions.ts`.
  - [x] Implement logic to insert collective and link the user as admin.
  - [x] Set initial status to `pending`.
- [x] **Testing**
  - [x] Unit test for the collective creation action.
  - [x] E2E test for the three paths of producer onboarding.
  - [x] Unit test for logo upload validation.

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Implementation Plan
- Adjusted `collectives` schema in `drizzle/schema` to include the desired fields (`logoUrl`, `location`, `genrePrimary`, JSON `socialLinks`, enum-like `status`).
- Added bridging table `collective_members` associating the profiles schema with collectives explicitly alongside a `role` constraint.
- Constructed a 3-way branching onboarding flow UI (`src/app/(dashboard)/onboarding/producer/page.tsx`) per UX constraints, driving "Criar Coletivo" implicitly inside internal form.
- Wrote unified transaction-level data inserts through `createCollectiveAction` enforcing `Zod` validation on all form values.
- Mapped successful DB insertions to `dashboard/collective` equipped with a local "Pending Approval" banner standard.
- E2E tests validating the navigation and presence of all 3 onboarding choices.

### Completion Notes
- ✅ All acceptance criteria fulfilled.
- ✅ Unit tests updated and validated. Flow is completely navigable locally.

### File List
- `src/db/schema/collectives.ts`
- `src/db/schema/collective-members.ts`
- `src/db/index.ts`
- `src/app/(dashboard)/onboarding/producer/page.tsx`
- `src/app/(dashboard)/dashboard/collective/page.tsx`
- `src/features/collectives/actions.ts`
- `src/features/collectives/components/create-collective-form.tsx`
- `e2e/producer-onboarding.spec.ts`

### Change Log
- 2026-04-15: Initial logic completed for Producer flow.
