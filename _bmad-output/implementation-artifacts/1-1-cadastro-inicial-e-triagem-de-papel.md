# Story 1.1: Cadastro Inicial e Triagem de Papel

Status: ready-for-dev

## Story

As a new visitor,
I want to provide my basic credentials and choose my role,
so that I can be correctly routed through the system.

## Acceptance Criteria

1. **Sign-up Form:** A functional registration page capturing Email, Password, and Nickname ("nome que quer ser chamado").
2. **Auth Integration:** Successful creation of `auth.user` via Supabase Auth (SSR).
3. **Profile Persistence:** Automatic creation of a record in the `profiles` table using Drizzle ORM, linked to the `auth.user.id`.
4. **Role Selection:** Mandatory selection between "Sou Artista" and "Sou Produtor de Eventos".
5. **Routing Logic:** 
    - If "Artista" is chosen, redirect to Artist Onboarding (Story 1.3).
    - If "Produtor" is chosen, redirect to Producer Onboarding (Story 1.4).
6. **Validation:** Client and server-side validation using Zod for all fields (Email format, Password strength, Nickname required).
7. **Security:** RLS policies on the `profiles` table must allow users to insert their own profile and read it.

## Tasks / Subtasks

- [ ] **Database Schema (AC: 3)**
  - [ ] Define `profiles` table in `src/db/schema/auth.ts` (id, user_id, nickname, role, created_at).
  - [ ] Generate and run migrations: `npx drizzle-kit generate` & `npx drizzle-kit push`.
- [ ] **UI Implementation (AC: 1, 4)**
  - [ ] Create Sign-up page: `src/app/(auth)/sign-up/page.tsx`.
  - [ ] Implement role selection radio group (Shadcn UI).
  - [ ] Add "Termos de Uso e Confidencialidade" checkbox (FR1).
- [ ] **Server Actions (AC: 2, 3, 5, 6)**
  - [ ] Create `signUpAction` in `src/features/auth/actions.ts`.
  - [ ] Implement Zod schema for sign-up validation.
  - [ ] Integrate Supabase `auth.signUp`.
  - [ ] Implement Drizzle insert for the `profiles` record.
  - [ ] Handle redirect logic based on the selected role.
- [ ] **Security (AC: 7)**
  - [ ] Configure RLS for the `profiles` table in Supabase.
- [ ] **Testing**
  - [ ] Unit test for `signUpAction` validation logic.
  - [ ] E2E test for the full sign-up and redirection flow.

## Dev Notes

- **Patterns:** Use the standard response format: `{ data: T | null, error: { message: string, code: string } | null }`. [Source: architecture.md#API-Response-Formats]
- **Naming:** Database columns in `snake_case`, code in `camelCase`. [Source: architecture.md#Naming-Patterns]
- **Auth:** Use Supabase SSR client. [Source: architecture.md#Auth-Method]

### Project Structure Notes

- Keep auth logic in `src/features/auth/`.
- UI components in `src/components/ui/` (Shadcn).

### References

- [PRD - FR1, FR5](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Data Architecture & Security](_bmad-output/planning-artifacts/architecture.md)
- [Epics - Story 1.1](_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Experimental)

### File List
- `src/db/schema/auth.ts`
- `src/app/(auth)/sign-up/page.tsx`
- `src/features/auth/actions.ts`
- `src/features/auth/components/sign-up-form.tsx`
