# Acceptance Auditor Findings - Story 1.2

- **Login page implemented at `/auth/login` instead of `/login`**
  - **Violates:** AC1 (A functional login page at `/login`) and AC4 (must be redirected to `/login`).
  - **Evidence:** `src/middleware.ts` (line 44) and `e2e/auth.spec.ts` (lines 6, 11 e 15).

- **Auth-related components are not placed in `src/features/auth/`**
  - **Violates:** Dev Notes constraint ("Auth-related components and actions in `src/features/auth/`").
  - **Evidence:** `src/components/login-form.tsx` and `src/components/shared/nav-user.tsx` are outside the specified feature directory.

- **Server actions do not return the standard wrapper on success/logout**
  - **Violates:** Dev Notes constraint ("All Server Actions must return the standard `{ data, error }` wrapper.").
  - **Evidence:** `src/features/auth/actions.ts` (lines 61-65). `signOutAction` (and the success path of `signInAction`) redirect without returning the `{ data, error }` structure.