# Story 2.4: Perfil Público Adaptativo e SEO

Status: done

**Epic:** 2 — Hub de Talentos e Soberania do Artista (Claim)
**FRs:** FR8, FR13
**Story ID:** 2.4
**Story Key:** `2-4-perfil-publico-adaptativo-e-seo`

> **Escopo desta story (decisão de planejamento):**
> 1. Adicionar coluna **`slug`** (text UNIQUE NOT NULL) na tabela `artists` via migration 006 com backfill determinístico (`unaccent` + `lower` + sanitização) e resolução de colisões por sufixo numérico.
> 2. Gerar `slug` em todas as actions de criação de artista: `saveArtistOnboardingAction`, `createOnTheFlyArtistAction`. (Claim não altera `artistic_name`, portanto o backfill cobre os registros on-the-fly existentes.)
> 3. Criar **`filterArtistForViewer(artist, viewer)`** — função pura de visibilidade que aplica `privacy_settings` ao perfil: respeita `mode` (public / collectives_only / private / ghost) e visibilidade por campo. Ghost Mode → retorna `null` (404) para não-owner/admin.
> 4. Criar **`getViewerContext()`** em `src/features/auth/helpers.ts`: resolve o visitante atual em `Viewer` (`anon` | `authenticated`). "Collectives Only" ⇒ visível apenas para `role='produtor'` ou `isAdmin`.
> 5. Criar rota pública **`/artists/[slug]`** (Next.js RSC): `generateMetadata` com title, description, OpenGraph; `notFound()` quando `filterArtistForViewer` retorna null.
> 6. Criar componente de apresentação **`PublicProfile`** (estética Line-over-Black).
> 7. Testes unitários: `slug.test.ts` (slugify + uniqueSlug) e `visibility.test.ts` (matriz viewer × mode × campo).
> 8. Testes E2E: `e2e/public-artist-profile.spec.ts` — anon vê perfil público; ghost → 404; pending → 404; produtor vê `collectives_only`.
> 9. Atualizar `global-setup.ts`: seeds para Ghost DJ, Pending DJ, Collectives DJ; novo produtor E2E; `slug` nos INSERTs; `PRODUCER_STORAGE_STATE`.
> 10. **Out-of-scope:** Owner preview antes de aprovação (deferred Story 5.x); UI granular de privacy por campo (deferred Story 2.3); aprovação admin UI (Story 5.1).

---

## Story

As an **Artist**,
I want **a professional public page that respects my privacy settings**,
so that **I can share my work only with the intended audience**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:361-375`](../planning-artifacts/epics.md):

1. **Given** a public visitor accessing an artist's URL
2. **When** the profile is approved and NOT in "Ghost Mode"
3. **Then** only fields marked as "Public" are rendered (Name and Location are always public)
4. **And** if the profile is in "Ghost Mode", the page must return a 404 for public visitors
5. **And** logged-in Collective users (`role='produtor'` or admin) can see fields marked as "Collectives Only".
6. **And** the page must include meta tags for basic SEO (FR13).

**Interpretação operacional:**

- AC #1–3: Rota `/artists/[slug]` — `filterArtistForViewer` retorna os campos dentro da visibilidade do viewer; `artisticName` e `location` são sempre públicos.
- AC #4: `mode === 'ghost'` para visitor sem owner/admin → `notFound()`.
- AC #5: `role='produtor' OR isAdmin` → `collectives_only` visível. Artistas logados não enxergam.
- AC #6: `generateMetadata` exporta `title`, `description`, `openGraph`, `alternates.canonical`.
- `status !== 'approved'` → 404 para todos (owner-preview deferido para Story 5.x).

## Tasks / Subtasks

- [x] **T1 · Migration 006: slug (AC 1–4)**
  - [x] Criar `supabase/migrations/006_artists_slug.sql`:
    - `CREATE EXTENSION IF NOT EXISTS unaccent`
    - ADD COLUMN slug nullable → backfill via ROW_NUMBER para colisões → SET NOT NULL → UNIQUE constraint + índice
  - [x] Atualizar `src/db/schema/artists.ts`: adicionar `slug: text('slug').notNull().unique()`

- [x] **T2 · Helper `slugify` + `uniqueSlug` (AC 1)**
  - [x] Criar `src/features/artists/slug.ts` com `slugify(name)` (NFD normalization) e `uniqueSlug(name, checkExists)` com retry `-2`, `-3`, ...
  - [x] Adicionar `slug` ao insert de `saveArtistOnboardingAction` em `src/features/artists/actions.ts`
  - [x] Adicionar `slug` ao insert de `createOnTheFlyArtistAction` em `src/features/artists/actions.ts`

- [x] **T3 · Função pura de visibilidade (AC 3–5)**
  - [x] Criar `src/features/artists/visibility.ts`: tipos `Viewer` + `PublicArtist`, `filterArtistForViewer(artist, viewer)`
  - [x] Regras: ghost → null; approved-only; campos por `fields[X]` e viewer role
  - [x] Criar `src/features/artists/queries.ts`: `getPublicArtistBySlug(slug)` com `import 'server-only'`
  - [x] Adicionar `getViewerContext()` em `src/features/auth/helpers.ts` (reusa `isPlatformAdmin`)

- [x] **T4 · Rota pública `/artists/[slug]` (AC 1–4, 6)**
  - [x] Criar `src/app/artists/[slug]/page.tsx` com `generateMetadata` + RSC page
  - [x] Criar `src/app/artists/[slug]/not-found.tsx`
  - [x] Criar `src/features/artists/components/public-profile.tsx`

- [x] **T5 · Testes unitários (AC 1–5)**
  - [x] `src/features/artists/slug.test.ts`: slugify para acentos/espaços/caracteres; uniqueSlug com colisão
  - [x] `src/features/artists/visibility.test.ts`: matriz 4 modes × 5 viewers × campos; status checks; Ghost mode

- [x] **T6 · Testes E2E + global-setup (AC 1–6)**
  - [x] Atualizar `e2e/global-setup.ts`: `PRODUCER_STORAGE_STATE`, seeds com `slug`, Ghost DJ, Pending DJ, Collectives DJ
  - [x] Criar `e2e/public-artist-profile.spec.ts`: anon vê perfil público + SEO title; ghost → 404; pending → 404; unknown → 404; collectives_only para anon oculto; produtor vê collectives_only

- [x] **T7 · Regressões e limpeza**
  - [x] `npm run type-check` → 0 erros
  - [x] `npm run lint` → 0 warnings
  - [x] `npm run test` → 138 testes passando (11 arquivos)

## Dev Notes

### Contexto de negócio

FR8 + FR13 completam o pilar de "Perfil Público" do Épico 2. A infraestrutura de `status` e `privacy_settings` construída na Story 2.3 é agora consumida: o artista controla o que o mundo vê, e a página serve meta tags para SEO básico (FR13). O `slug` deriva do `artistic_name` de forma determinística e resolve colisões com sufixo numérico.

### Arquitetura — guardrails obrigatórios

- **Stack:** idêntica às stories anteriores — Next 15 + React 19 + Supabase SSR + Drizzle 0.45.2 + Shadcn `base-nova` + Vitest 4 + Playwright.
- **Feature folder pattern:** `src/features/artists/` para visibility, slug, queries, public-profile. Rota pública em `src/app/artists/[slug]/`.
- **Collectives Only:** visível apenas para `role='produtor'` ou `isAdmin`. Artistas autenticados não vêem.
- **Owner-preview:** NOT implementado nesta story. Apenas `status='approved'` é renderizado publicamente.
- **Drizzle bypassa RLS:** filtragem é feita em código em `filterArtistForViewer`. `getPublicArtistBySlug` retorna raw row sem filtro de status — o filtro fica no `filterArtistForViewer`.
- **`server-only`:** `queries.ts` importa `'server-only'` para evitar importação acidental em client components.

### Modelo de dados — adição

| Coluna | Tipo | Nota |
|---|---|---|
| `slug` | text NOT NULL UNIQUE | **novo — 006** — gerado de `artistic_name` via `slugify()` |

### URL canônica

`/artists/<slug>` — sem prefixo de locale, sem trailing slash. `generateMetadata` seta `alternates.canonical`.

### Segurança

- `slugify` nunca produz `/`, `..`, ou caracteres perigosos — apenas `[a-z0-9-]`.
- Colisão de slug: `uniqueSlug` com `checkExists` previne `23505` no slug; ainda deve-se capturar `23505` nos inserts (colisão concorrente improvável mas possível).

### Previous Story Intelligence

**Story 2.3** ([2-3-busca-obrigatoria-claim-e-gestao-de-privacidade.md](2-3-busca-obrigatoria-claim-e-gestao-de-privacidade.md)):
- `ArtistPrivacySettings`, `PrivacyMode`, `FieldVisibility`, `DEFAULT_PRIVACY_SETTINGS` em `src/features/artists/types.ts` — reusados em `visibility.ts`.
- `isPlatformAdmin` em `src/features/auth/helpers.ts` — reusado em `getViewerContext`.
- Migration 005 criou `status` e `privacy_settings` — `filterArtistForViewer` os consome diretamente.

**Story 2.1 + 2.2:**
- `createOnTheFlyArtistAction` atualizada com geração de slug.
- `ArtistIdentityCard` não alterado nesta story (não vincula para `/artists/[slug]`; link é enhancement deferred).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8,FR13]
- [Source: _bmad-output/planning-artifacts/architecture.md]
- [Source: _bmad-output/implementation-artifacts/2-3-busca-obrigatoria-claim-e-gestao-de-privacidade.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(nenhum — implementação direta conforme plano aprovado)_

### Completion Notes List

- Migration 006 usa `unaccent` extension + `ROW_NUMBER()` para backfill collision-safe.
- `filterArtistForViewer` é função pura — 100% testável sem mocks.
- `getViewerContext` reusa `isPlatformAdmin` de helpers.ts (Story 2.3); fallback `anon` em qualquer erro de DB.
- `global-setup.ts` refatorado para extrair `saveStorageState` e adicionar `PRODUCER_STORAGE_STATE`.
- `queries.ts` retorna row crua — filtragem fica no consumidor (`page.tsx`) para separar responsabilidades.
- `npm run type-check` → 0 erros | `npm run lint` → 0 warnings | `npm run test` → 138 testes passando (11 arquivos; +33 novos: 7 slug + 26 visibility).
- E2E (`npm run test:e2e`) requer Supabase local com migration 006 aplicada — deferido ao CI/CD pipeline.

### File List

**Criados:**
- `supabase/migrations/006_artists_slug.sql`
- `src/features/artists/slug.ts`
- `src/features/artists/slug.test.ts`
- `src/features/artists/visibility.ts`
- `src/features/artists/visibility.test.ts`
- `src/features/artists/queries.ts`
- `src/features/artists/components/public-profile.tsx`
- `src/app/artists/[slug]/page.tsx`
- `src/app/artists/[slug]/not-found.tsx`
- `e2e/public-artist-profile.spec.ts`

**Modificados:**
- `src/db/schema/artists.ts` (coluna slug)
- `src/features/artists/actions.ts` (slug em saveArtist + createOnTheFly)
- `src/features/auth/helpers.ts` (getViewerContext + PRODUCER_STORAGE_STATE)
- `e2e/global-setup.ts` (produtor user, seeds com slug, PRODUCER_STORAGE_STATE)

### Change Log

- 2026-04-28: Story criada e implementada por `claude-sonnet-4-6`. Migration 006 (slug), helper slugify/uniqueSlug, filterArtistForViewer, getViewerContext, rota /artists/[slug], PublicProfile, testes unitários (slug + visibility) e E2E scaffold. 138 testes passando. Status → review.
- 2026-04-28: Patches de code review aplicados por `claude-sonnet-4-6` (branch `fix/story-2-4-review-patches`). 10 patches HIGH/MEDIUM resolvidos. 5 items deferidos. Status → done.

### Review Findings

> Code review executado em 2026-04-28 com 3 camadas adversariais (Blind Hunter, Edge Case Hunter, Acceptance Auditor).
> **25 findings brutos → 17 únicos após dedup → 10 patches aplicados, 5 deferidos, 4 descartados.**

- [x] [Review][Patch] photoUrl gated incorretamente por fields.social_links — agora sempre público [src/features/artists/visibility.ts:79]
- [x] [Review][Patch] getViewerContext/isPlatformAdmin engoliam erros silenciosamente — adicionado console.error [src/features/auth/helpers.ts:23,51]
- [x] [Review][Patch] slugify retorna '' para nomes não-Latinos/símbolos — fallback 'artist' [src/features/artists/slug.ts:13]
- [x] [Review][Patch] Migration 006 backfill não tratava candidate vazio — NULLIF+COALESCE adicionado [supabase/migrations/006_artists_slug.sql:10]
- [x] [Review][Patch] Docstring de getPublicArtistBySlug afirmava filtro approved inexistente — corrigida [src/features/artists/queries.ts:8]
- [x] [Review][Patch] Cast inseguro socialLinks as Record<string,string> sem validação — guard de tipo adicionado [src/features/artists/visibility.ts:89]
- [x] [Review][Patch] Dupla query por request (generateMetadata + page) sem dedup — React.cache() adicionado [src/app/artists/[slug]/page.tsx:10]
- [x] [Review][Patch] slug case-sensitivity em URL — slug.toLowerCase() antes da query [src/app/artists/[slug]/page.tsx:20]
- [x] [Review][Patch] 404 vazava existência de perfis Ghost — mensagem genérica [src/app/artists/[slug]/not-found.tsx:9]
- [x] [Review][Patch] <img> sem otimização next/image — migrado + remotePatterns configurados [src/features/artists/components/public-profile.tsx:28]
- [x] [Review][Defer] PLAYWRIGHT_BASE_URL não documentada para CI [e2e/global-setup.ts] — deferred, pre-existing
- [x] [Review][Defer] Cobertura E2E para status 'rejected' ausente — deferred, escopo Story 5.x
- [x] [Review][Defer] Artistas órfãos (profileId=null) em ghost ficam 404 até claim — deferred, comportamento intencional (Story 2.5/2.6)
- [x] [Review][Defer] Validação runtime de privacySettings jsonb — deferred, hardening futuro
- [x] [Review][Defer] Race condition session entre generateMetadata e page — deferred, mitigado por React.cache()
