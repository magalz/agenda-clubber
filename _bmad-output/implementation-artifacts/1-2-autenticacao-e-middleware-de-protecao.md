# Story 1.2: Autenticação e Middleware de Proteção

Status: done

<!-- Implementação re-executada em branch claude/serene-goodall-76a4d2 por claude-sonnet-4-6 em 2026-04-17 -->

## Story

As a registered user,
I want to log in and out securely,
so that my professional data remains private and my session is properly managed.

## Acceptance Criteria

1. **Login Page:** A functional login page at `/auth/login` with Email and Password fields. *(rota canônica: `/auth/login`, consistente com `/auth/forgot-password` e `/auth/sign-up`)*
2. **Authentication:** Successful authentication via Supabase Auth (SSR) using the `signInWithPassword` method.
3. **Session Management:** Establishment of a secure session cookie managed via `supabase-ssr`.
4. **Middleware Protection:**
    - Non-authenticated users attempting to access `/dashboard` (and its subroutes) or `/admin` must be redirected to `/auth/login`.
    - Authenticated users attempting to access `/auth/**`, `/login` or `/sign-up` should be redirected to `/dashboard`.
5. **Logout:** A functional logout button that clears the session and redirects the user to the public homepage.
6. **Error Handling:** Clear feedback for invalid credentials or server errors (Zod validation + Supabase errors).
7. **Security:** Implement RBAC checks in the middleware (e.g., only users with `admin` role in the `profiles` table can access `/admin`).

## Tasks / Subtasks

- [x] **Auth Implementation (AC: 1, 2, 5)**
  - [x] Create Login page: `src/app/(auth)/login/page.tsx`.
  - [x] Implement `signInAction` and `signOutAction` in `src/features/auth/actions.ts`.
  - [x] Create `LoginForm` component with Zod validation.
- [x] **Middleware (AC: 3, 4, 7)**
  - [x] Configure `src/middleware.ts` to refresh the Supabase session.
  - [x] Implement route protection logic for `dashboard` and `admin`.
  - [x] Implement RBAC check: Fetch user profile and verify `role` before allowing access to `/admin`.
- [x] **UI Components**
  - [x] Add Logout button to a shared navigation component (e.g., `src/components/shared/nav-user.tsx`).
- [x] **Testing**
  - [x] E2E test for successful login and redirection.
  - [x] E2E test for unauthorized access to `/dashboard` and `/admin`.
  - [x] Unit test for the middleware logic (mocking Supabase client).

## Dev Notes

- **Patterns:** Server Actions de erro retornam `{ data: null, error }`. Server Actions cujo sucesso chama `redirect()` (ex: `signInAction`, `signOutAction`) não retornam o wrapper — `redirect()` lança internamente no Next.js, impossibilitando o retorno. Exceção aceita. [Source: architecture.md#API-Response-Formats]
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
claude-sonnet-4-6 (re-implementação em branch claude/serene-goodall-76a4d2 em 2026-04-17)

> Implementação anterior: Gemini 2.5 Pro (código nunca commitado no worktree)

### Implementation Plan
- Criado `src/features/auth/actions.ts` com `signInAction` (Zod + Supabase signInWithPassword, redireciona para `/dashboard`) e `signOutAction` (limpa sessão, redireciona para `/`). Padrão `{ data, error }` em todos os retornos.
- Refatorado `src/components/login-form.tsx` de cliente puro (browser Supabase) para usar `useActionState` + `signInAction` com exibição de erros de campo do Zod.
- Criado `src/middleware.ts` com: refresh de sessão via Supabase SSR, proteção de `/dashboard` e `/admin`, redirecionamento de usuários autenticados em rotas `/auth/*`, e RBAC para `/admin` consultando `profiles.role`.
- Criado `src/components/shared/nav-user.tsx` com botão de logout usando `useTransition` + `signOutAction`.
- Criado `src/middleware.test.ts` com 6 testes Vitest (mocks de next/server e @supabase/ssr).
- Criado `e2e/auth.spec.ts` com 3 testes Playwright.
- Corrigido `tsconfig.json`: paths `@/*` de `"./*"` para `"./src/*"` para alinhar com o main repo.
- Criados `vitest.config.ts` e `playwright.config.ts` no worktree.

### Completion Notes
- ✅ AC1: `/auth/login` com campos email e senha funcionais
- ✅ AC2: `signInAction` usa `signInWithPassword` via Supabase SSR
- ✅ AC3: Sessão gerenciada via cookies pelo middleware Supabase SSR
- ✅ AC4: Middleware protege `/dashboard` e `/admin`; redireciona `/auth/*` para autenticados
- ✅ AC5: `signOutAction` limpa sessão e redireciona para `/`
- ✅ AC6: Erros Zod (campo a campo) e erros Supabase exibidos no form
- ✅ AC7: RBAC no middleware verifica `profiles.role === "admin"` antes de liberar `/admin`
- ✅ 6/6 testes de unidade passando (`npx vitest run`)
- ✅ TypeScript sem erros (`npx tsc --noEmit`)

### File List
- `src/app/auth/login/page.tsx` (existente, mantido)
- `src/features/auth/actions.ts` (criado)
- `src/middleware.ts` (criado)
- `src/middleware.test.ts` (criado)
- `src/components/login-form.tsx` (refatorado)
- `src/components/shared/nav-user.tsx` (criado)
- `e2e/auth.spec.ts` (criado)
- `vitest.config.ts` (criado)
- `playwright.config.ts` (criado)
- `tsconfig.json` (corrigido paths)

### Review Findings

#### Decision Needed → Resolvidos
- [x] [Review][Decision] Rota de login: aceita `/auth/login` como canônica — AC1 e AC4 atualizados na spec. Consistente com demais rotas `/auth/*`. *(2026-04-17)*
- [x] [Review][Decision] Server Actions e `redirect()`: aceita como exceção. `redirect()` no Next.js lança internamente, impossibilitando retorno do wrapper. Documentado nos Dev Notes. *(2026-04-17)*

#### Patches → Aplicados
- [x] [Review][Patch] Env vars sem guard — validação explícita adicionada; retorna `Response 500` se ausentes [src/middleware.ts:6-10]
- [x] [Review][Patch] getUser() sem guard de null — substituído por `data?.user ?? null` [src/middleware.ts:41]
- [x] [Review][Patch] formData.get('email') pode ser File — type guard `typeof !== "string"` adicionado [src/features/auth/actions.ts:21-26]
- [x] [Review][Patch] signOut failure não tratada — erro capturado e logado com `console.error` [src/features/auth/actions.ts:70-72]
- [x] [Review][Patch] Ofuscação de erros no signInAction — distingue `email_not_confirmed` de credenciais inválidas [src/features/auth/actions.ts:57-63]
- [x] [Review][Patch] Tipo `data: { success: boolean }` nunca retornado — simplificado para `data: null` [src/features/auth/actions.ts:12]
- [x] [Review][Patch] Campo de senha sem `autoComplete` — adicionado `autoComplete="current-password"` e `autoComplete="email"` [src/components/login-form.tsx]

#### Deferred
- [x] [Review][Defer] Latência de BD por requisição em /admin — query ao `profiles` em todo request; otimizável via JWT claims [src/middleware.ts:51-60] — deferred, design decision
- [x] [Review][Defer] E2E usa `npm run dev` — mais lento que build/start; aceitável para desenvolvimento local [playwright.config.ts:8]
- [x] [Review][Defer] Sem feedback visual durante logout — botão desabilitado mas sem spinner [src/components/shared/nav-user.tsx:21]
- [x] [Review][Defer] Mocks manuais de NextRequest/NextResponse frágeis — podem divergir do comportamento real do Next.js [src/middleware.test.ts:5-35]
- [x] [Review][Defer] Rotas de redirecionamento hardcoded em múltiplos arquivos — `/auth/login`, `/dashboard` repetidos sem constante central
- [x] [Review][Defer] login-form e nav-user fora de `src/features/auth/` — ambiguidade de convenção (são componentes UI/shared) [src/components/]

### Change Log
- 2026-04-15: Implementação inicial por Gemini 2.5 Pro (não commitada)
- 2026-04-17: Re-implementação por claude-sonnet-4-6 no worktree claude/serene-goodall-76a4d2; corrigido tsconfig; 6 testes unitários passando
