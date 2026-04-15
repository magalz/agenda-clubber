# Story 1.3: Onboarding de Artista (Perfil Essencial)

Status: ready-for-dev

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

- [ ] **Database Schema (AC: 3)**
  - [ ] Define `artists` table in `src/db/schema/artists.ts` (id, profile_id, artistic_name, location, genre_primary, genre_secondary, social_links, presskit_url, bio, is_verified, created_at).
  - [ ] Generate and run migrations.
- [ ] **UI Implementation (AC: 1, 2)**
  - [ ] Create Artist Onboarding page: `src/app/(dashboard)/onboarding/artist/page.tsx`.
  - [ ] Implement "Search Before Create" component.
  - [ ] Build the profile form using Shadcn UI components.
  - [ ] Implement file upload for Profile Photo and Release PDF (Supabase Storage).
- [ ] **Server Actions (AC: 3, 4, 5)**
  - [ ] Create `saveArtistOnboardingAction` in `src/features/artists/actions.ts`.
  - [ ] Implement artist search logic to check for duplicates.
  - [ ] Implement Zod validation schema.
  - [ ] Integrate Supabase Storage for file uploads.
- [ ] **Testing**
  - [ ] Unit test for the duplicate search logic.
  - [ ] E2E test for the mandatory search and onboarding completion.
  - [ ] Unit test for file upload validation.

## Dev Notes

- **Patterns:** Use feature-based organization in `src/features/artists/`. [Source: architecture.md#Project-Organization]
- **Storage:** Use Supabase Storage buckets for `photos` and `presskits`.
- **Search:** Use Drizzle `ilike` for case-insensitive artistic name search.

### Project Structure Notes

- Keep the "Search Before Create" logic isolated in a component to be reused if needed.
- Profile data must be linked to the `profiles` record created in Story 1.1.

### References

- [PRD - FR1, FR9, FR10](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Project Structure & Boundaries](_bmad-output/planning-artifacts/architecture.md)
- [UX Spec - UX-DR8](_bmad-output/planning-artifacts/ux-design-specification.md)
- [Handoff - P1-001](_bmad-output/test-artifacts/test-design/test-design-qa.md)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Experimental)

### File List
- `src/db/schema/artists.ts`
- `src/app/(dashboard)/onboarding/artist/page.tsx`
- `src/features/artists/actions.ts`
- `src/features/artists/components/onboarding-form.tsx`
- `src/features/artists/components/search-before-create.tsx`
