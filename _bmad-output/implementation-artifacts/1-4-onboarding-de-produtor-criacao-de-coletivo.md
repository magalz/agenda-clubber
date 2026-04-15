# Story 1.4: Onboarding de Produtor (Criação de Coletivo)

Status: ready-for-dev

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

- [ ] **Database Schema (AC: 3)**
  - [ ] Define `collectives` table in `src/db/schema/collectives.ts` (id, name, location, logo_url, description, genres, social_links, status, created_at).
  - [ ] Define `collective_members` table (id, collective_id, profile_id, role, joined_at) to manage the link.
  - [ ] Generate and run migrations.
- [ ] **UI Implementation (AC: 1, 2)**
  - [ ] Create Producer Onboarding selector page: `src/app/(dashboard)/onboarding/producer/page.tsx`.
  - [ ] Implement the "Create Collective" form using Shadcn UI.
  - [ ] Implement logo upload to Supabase Storage.
- [ ] **Server Actions (AC: 3, 4, 6)**
  - [ ] Create `createCollectiveAction` in `src/features/collectives/actions.ts`.
  - [ ] Implement logic to insert collective and link the user as admin.
  - [ ] Set initial status to `pending`.
- [ ] **Testing**
  - [ ] Unit test for the collective creation action.
  - [ ] E2E test for the three paths of producer onboarding.
  - [ ] Unit test for logo upload validation.

## Dev Notes

- **Patterns:** Use feature-based organization in `src/features/collectives/`. [Source: architecture.md#Project-Organization]
- **Security:** Ensure RLS policies on `collectives` and `collective_members` are properly initialized.
- **Wait Time:** Path C should explain that the user needs an email invitation from an existing admin.

### Project Structure Notes

- Redirects and routing should be handled within the Server Actions.
- Use Supabase Storage bucket `logos` for collective branding.

### References

- [PRD - FR1, FR2, FR3, FR4](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Project Structure & Boundaries](_bmad-output/planning-artifacts/architecture.md)
- [Epics - Story 1.4](_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Experimental)

### File List
- `src/db/schema/collectives.ts`
- `src/db/schema/collective-members.ts`
- `src/app/(dashboard)/onboarding/producer/page.tsx`
- `src/features/collectives/actions.ts`
- `src/features/collectives/components/create-collective-form.tsx`
