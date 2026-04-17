# Story 1.3: Onboarding de Artista (Perfil Essencial)

Status: done

## Story

As a new Artist,
I want to provide my artistic details,
so that I can be found by collectives and manage my identity.

## Acceptance Criteria

1. **Mandatory Search:** Before filling the onboarding form, the system must force a search for existing "on-the-fly" profiles with the same "Nome Artístico" (UX-DR8).
2. **Onboarding Form:** A multi-step or single-page form capturing:
    - **Obrigatórios:** Nome Artístico, Localidade (Cidade), Estilo Principal (Gênero).
    - **Opcionais:** Estilo Secundário, SoundCloud (URL), YouTube (URL), Instagram (URL), Presskit (URL), Release (PDF), Foto de Perfil.
3. **Data Persistence:** Records must be saved in the `artists` table and linked to the user's `profile_id`.
4. **Validation:** Server-side validation with Zod for all fields, including URL formats and file size/type for uploads.
5. **Redirection:** Upon successful completion, redirect the user to their private Artist Dashboard (`/dashboard/artist`).
6. **Privacy:** The profile is created with `is_verified: true` and respects the default privacy settings (public by default for verified artists).

## Tasks / Subtasks

- [x] **Database Schema (AC: 3)**
  - [x] Define `artists` table in `src/db/schema/artists.ts` (id, profile_id, artistic_name, location, genre_primary, genre_secondary, social_links, presskit_url, bio, is_verified, created_at).
  - [x] Generate and run migrations.
- [x] **UI Implementation (AC: 1, 2)**
  - [x] Create Artist Onboarding page: `src/app/(dashboard)/onboarding/artist/page.tsx`.
  - [x] Implement "Search Before Create" component.
  - [x] Build the profile form using Shadcn UI components.
  - [x] Implement file upload for Profile Photo and Release PDF (Supabase Storage).
- [x] **Server Actions (AC: 3, 4, 5)**
  - [x] Create `saveArtistOnboardingAction` in `src/features/artists/actions.ts`.
  - [x] Implement artist search logic to check for duplicates.
  - [x] Implement Zod validation schema.
  - [x] Integrate Supabase Storage for file uploads.
- [x] **Testing**
  - [x] Unit test for the duplicate search logic.
  - [x] E2E test for the mandatory search and onboarding completion.
  - [x] Unit test for file upload validation.

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Implementation Plan
- Mapped schema for `artists` into `src/db/schema/artists.ts` linking to `profiles.id`. Run drizzle push.
- Implemented `saveArtistOnboardingAction` incorporating checks using `checkDuplicateArtist` via `ilike` statement limit 1.
- Constructed UI via `search-before-create.tsx` enforcing the duplicate check UX BEFORE allowing data insertion on `onboarding-form.tsx`.
- Managed multi-step transition on `src/app/(dashboard)/onboarding/artist/page.tsx` using local state to lock artistic name downstream.
- Created DDL migration `002_storage_setup.sql` initiating `artist_media` Supabase bucket with policies.
- Unit Testing of duplicates avoiding DB hit on empty strings.
- E2E Test utilizing playwright verifying UX logic sequences.

### Completion Notes
- ✅ All acceptance criteria fulfilled. Tests all passed (24 unit tests now).

### File List
- `src/db/schema/artists.ts`
- `src/app/(dashboard)/onboarding/artist/page.tsx`
- `src/app/(dashboard)/dashboard/artist/page.tsx`
- `src/features/artists/actions.ts`
- `src/features/artists/actions.test.ts`
- `src/features/artists/components/onboarding-form.tsx`
- `src/features/artists/components/search-before-create.tsx`
- `e2e/artist-onboarding.spec.ts`
- `supabase/migrations/002_storage_setup.sql`

### Change Log
- 2026-04-15: Completed onboarding artist form logic and search constraints.
- 2026-04-16: Applied code review findings (Gemini review) — fixed isVerified bug (true→false), added file upload (photo+PDF) with Supabase Storage, Zod trim/max on text fields, socialLinks filtering, encType multipart on form, field errors for URL inputs, UNIQUE constraint migration, RLS DELETE policy for storage.
