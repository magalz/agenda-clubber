# Story 1.2: Autenticação e Middleware de Proteção

Status: ready-for-dev

## Story

As a registered user,
I want to log in and out securely,
so that my professional data remains private and my session is properly managed.

## Acceptance Criteria

1. **Login Page:** A functional login page at `/login` with Email and Password fields.
2. **Authentication:** Successful authentication via Supabase Auth (SSR) using the `signInWithPassword` method.
3. **Session Management:** Establishment of a secure session cookie managed via `supabase-ssr`.
4. **Middleware Protection:**
    - Non-authenticated users attempting to access `/dashboard` (and its subroutes) or `/admin` must be redirected to `/login`.
    - Authenticated users attempting to access `/login` or `/sign-up` should be redirected to `/dashboard`.
5. **Logout:** A functional logout button that clears the session and redirects the user to the public homepage.
6. **Error Handling:** Clear feedback for invalid credentials or server errors (Zod validation + Supabase errors).
7. **Security:** Implement RBAC checks in the middleware (e.g., only users with `admin` role in the `profiles` table can access `/admin`).

## Tasks / Subtasks

- [ ] **Auth Implementation (AC: 1, 2, 5)**
  - [ ] Create Login page: `src/app/(auth)/login/page.tsx`.
  - [ ] Implement `signInAction` and `signOutAction` in `src/features/auth/actions.ts`.
  - [ ] Create `LoginForm` component with Zod validation.
- [ ] **Middleware (AC: 3, 4, 7)**
  - [ ] Configure `src/middleware.ts` to refresh the Supabase session.
  - [ ] Implement route protection logic for `dashboard` and `admin`.
  - [ ] Implement RBAC check: Fetch user profile and verify `role` before allowing access to `/admin`.
- [ ] **UI Components**
  - [ ] Add Logout button to a shared navigation component (e.g., `src/components/shared/nav-user.tsx`).
- [ ] **Testing**
  - [ ] E2E test for successful login and redirection.
  - [ ] E2E test for unauthorized access to `/dashboard` and `/admin`.
  - [ ] Unit test for the middleware logic (mocking Supabase client).

## Dev Notes

- **Patterns:** Ensure all Server Actions return the standard `{ data, error }` wrapper. [Source: architecture.md#API-Response-Formats]
- **Middleware:** Refer to Supabase SSR documentation for Next.js Middleware implementation. [Source: architecture.md#Auth-Method]
- **RBAC:** Roles are stored in the `profiles` table created in Story 1.1.

### Project Structure Notes

- Absolute imports using `@/`.
- Auth-related components and actions in `src/features/auth/`.

### References

- [PRD - FR5](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Authentication & Security](_bmad-output/planning-artifacts/architecture.md)
- [Epics - Story 1.2](_bmad-output/planning-artifacts/epics.md)
- [Handoff - Risk R-02](_bmad-output/test-artifacts/test-design/agenda-clubber-handoff.md)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Experimental)

### File List
- `src/app/(auth)/login/page.tsx`
- `src/features/auth/actions.ts`
- `src/middleware.ts`
- `src/features/auth/components/login-form.tsx`
