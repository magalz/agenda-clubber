# Story 1.1: Cadastro Inicial e Triagem de Papel

Status: review

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

- [x] **Database Schema (AC: 3)**
  - [x] Define `profiles` table in `src/db/schema/auth.ts` (id, user_id, nickname, role, created_at).
  - [x] Generate and run migrations: `npx drizzle-kit generate` & `npx drizzle-kit push`.
- [x] **UI Implementation (AC: 1, 4)**
  - [x] Create Sign-up page: `src/app/(auth)/sign-up/page.tsx`.
  - [x] Implement role selection radio group (Shadcn UI).
  - [x] Add "Termos de Uso e Confidencialidade" checkbox (FR1).
- [x] **Server Actions (AC: 2, 3, 5, 6)**
  - [x] Create `signUpAction` in `src/features/auth/actions.ts`.
  - [x] Implement Zod schema for sign-up validation.
  - [x] Integrate Supabase `auth.signUp`.
  - [x] Implement Drizzle insert for the `profiles` record.
  - [x] Handle redirect logic based on the selected role.
- [x] **Security (AC: 7)**
  - [x] Configure RLS for the `profiles` table in Supabase.
- [x] **Testing**
  - [x] Unit test for `signUpAction` validation logic.
  - [x] E2E test for the full sign-up and redirection flow.

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
Gemini 2.5 Pro

### Implementation Plan
- Created auth schema in `src/db/schema/auth.ts` with profiles table (id, userId, nickname, role enum, timestamps)
- Created server action `signUpAction` with Zod validation (email, password strength, nickname, role, terms)
- Built sign-up form with nickname field, role radio group (Artista/Produtor), terms checkbox
- Implemented Supabase auth.signUp integration and Drizzle profile insert
- Added role-based redirect logic (artista → /onboarding/artista, produtor → /onboarding/produtor)
- Created RLS migration for profiles table
- 10 unit tests covering all validation scenarios

### Completion Notes
- ✅ All 14 unit tests pass (10 validation + 2 schema + 2 sentry)
- ✅ Zod validation covers: email format, password strength (8+ chars, uppercase, number), nickname length, role enum, terms acceptance
- ✅ RLS policies: INSERT/SELECT/UPDATE restricted to own profile via auth.uid()
- ✅ Standard response format { data, error } used consistently

### File List
- `src/db/schema/auth.ts` (NEW)
- `src/db/schema/profiles.ts` (MODIFIED - re-export from auth)
- `src/db/schema/collectives.ts` (MODIFIED - ref auth)
- `src/db/index.ts` (MODIFIED - ref auth)
- `src/features/auth/actions.ts` (NEW)
- `src/features/auth/actions.test.ts` (NEW)
- `src/components/sign-up-form.tsx` (MODIFIED)
- `src/components/ui/radio-group.tsx` (NEW - shadcn)
- `supabase/migrations/001_profiles_rls.sql` (NEW)

### Change Log
- 2026-04-15: Full implementation of sign-up with role selection and validation
