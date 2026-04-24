# Story 2.3: Busca Obrigatória, Claim e Gestão de Privacidade

Status: ready-for-dev

**Epic:** 2 — Hub de Talentos e Soberania do Artista (Claim)
**FRs:** FR9, FR12
**UX-DRs:** UX-DR7 (Artist Identity Card), UX-DR8 (Mandatory Search Flow)
**Story ID:** 2.3
**Story Key:** `2-3-busca-obrigatoria-claim-e-gestao-de-privacidade`

> **Escopo desta story (decisão de planejamento):**
> 1. Substituir a busca booleana de onboarding (`checkDuplicateArtist`) por **busca real de perfis restritos** que retorna o hit para permitir **Claim** (FR9 + UX-DR8).
> 2. Introduzir **`status`** (`pending_approval | approved | rejected`) em `artists` + **`bio`** + **`privacy_settings`** (jsonb) — via migration `005`.
> 3. Estender `OnboardingForm` para aceitar **bio** e **Privacy Settings** (Public / Collectives Only / Private / Ghost Mode) **antes** da submissão.
> 4. Adicionar **Server Action `claimArtistProfileAction`**: vincula `artists.profile_id` ao usuário atual (apenas se `profile_id IS NULL`), popula perfil completo + privacidade, e move o registro para `status='pending_approval'`.
> 5. Atualizar **`saveArtistOnboardingAction`** (criação "nova"): também grava em `status='pending_approval'` e aceita `bio` + `privacy_settings`.
> 6. Atualizar **filtros de visibilidade**: `searchTalents` (Story 2.2), `ArtistIdentityCard` CTA "Claim this Profile" ativado, e **RLS** garantindo que `pending_approval` e `rejected` só sejam visíveis ao próprio `profile_id` e a **platform admins**.
> 7. **Out-of-scope:** aprovação admin UI (Story 5.1), perfil público adaptativo e SEO (Story 2.4), notificação de claim via e-mail para admins (reusar QStash existente apenas se trivial; caso contrário deferir).

---

## Story

As a **new Artist em onboarding**,
I want to **verificar se já existe um perfil restrito no meu nome, reivindicá-lo e completar todos os dados (incluindo privacidade) antes da aprovação**,
so that **I can claim my identity and provide all verification data to the admin in a single flow**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:346-359`](../planning-artifacts/epics.md):

1. **Given** a user in the Artist Onboarding flow **When** they enter their "Nome Artístico", the system must perform a background search for restricted profiles (FR9).
2. **Then** if a match is found, they are presented with the **"Claim this Profile"** option; otherwise, they proceed to **"Create New"**.
3. **And** the user is allowed to complete their **FULL profile** (Photo, Social Links, Presskit, Bio) and set **Privacy Settings** (Public, Collectives Only, Private, or Ghost Mode) before submission.
4. **And** upon submission, the profile enters a **`pending_approval`** state.
5. **And** while pending, the data is visible to **platform admins** for verification but **restricted for other users** until final approval (FR12).

**Interpretação operacional:**

- AC #1: busca é disparada pelo próprio usuário (clique em "Buscar") no step 1 do onboarding — FR9 não exige debounce ao digitar, exige **bloqueio do avanço** sem busca prévia. Buscar apenas artistas com `profile_id IS NULL` (restritos/on-the-fly). Matching case-insensitive por `artistic_name` exato (`ilike(name)` normalizado).
- AC #2: se `hit != null` → UI mostra `ArtistIdentityCard variant='restricted'` com CTA **"Reivindicar este perfil"** + CTA secundário "Não sou eu, criar novo". Se `hit == null` → avança direto para o form de criação. **Não** oferecer claim de perfis com `profile_id` já preenchido (já reivindicados).
- AC #3: o **mesmo form** (extensão do `OnboardingForm`) é usado tanto no fluxo Claim quanto Create. No Claim, `artisticName` e `location` existentes são prefill (`artisticName` fica readonly); os demais campos são obrigatórios/opcionais iguais ao create.
- AC #4: ambas as actions (`saveArtistOnboardingAction` e `claimArtistProfileAction`) gravam `status='pending_approval'`. Migration define o default `'pending_approval'`.
- AC #5: reforçado em **três camadas**: (a) RLS no Postgres (`artists` SELECT limita a `profile_id=auth.uid` OR `profiles.role='admin'` OR `status='approved'`); (b) `searchTalents` (2.2) passa a filtrar `status='approved'` para não-admins — admins vêem tudo; (c) `ArtistIdentityCard` só renderiza CTA Claim se `status='approved'` E `profile_id IS NULL`.

## Tasks / Subtasks

- [ ] **T1 · Migration 005: status, bio, privacy_settings (AC 3, 4, 5)**
  - [ ] Criar `supabase/migrations/005_artists_claim_privacy.sql`:
    ```sql
    -- Story 2.3: Claim e gestão de privacidade.
    ALTER TABLE artists ADD COLUMN bio text;
    ALTER TABLE artists ADD COLUMN status text NOT NULL DEFAULT 'pending_approval'
      CHECK (status IN ('pending_approval', 'approved', 'rejected'));
    ALTER TABLE artists ADD COLUMN privacy_settings jsonb NOT NULL
      DEFAULT '{"mode":"public","fields":{"social_links":"public","presskit":"public","bio":"public","genre":"public"}}'::jsonb;

    -- Backfill: artistas já criados em 2.1 / 1.3 assumem estado compatível com MVP atual.
    -- Artistas on-the-fly (is_verified=false, profile_id NULL) entram como 'approved' para manter visibilidade existente
    -- (eles já aparecem em busca hoje). Claim futuro os move para pending_approval.
    UPDATE artists SET status='approved' WHERE status='pending_approval' AND profile_id IS NULL;
    -- Artistas já verificados (Story 1.3) também permanecem 'approved'.
    UPDATE artists SET status='approved' WHERE is_verified=true;

    -- Índice para filtros frequentes (busca global, admin dashboard futuro).
    CREATE INDEX IF NOT EXISTS artists_status_idx ON artists(status);
    ```
  - [ ] Atualizar RLS de `SELECT` em `artists` (adicionar ao mesmo arquivo):
    ```sql
    -- Revogar policy anterior de SELECT se permissiva demais; criar nova.
    DROP POLICY IF EXISTS "Artists are viewable by everyone" ON artists;
    DROP POLICY IF EXISTS "artists_select_public" ON artists;

    CREATE POLICY "artists_select_approved_or_owner_or_admin"
    ON artists FOR SELECT TO authenticated, anon
    USING (
      status = 'approved'
      OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
    );
    ```
  - [ ] **Atenção:** o enum de `profiles.role` atualmente é `('artista','produtor')` — a checagem `role='admin'` funciona via RLS mesmo sem estar no enum (text column), mas é pré-condição que **platform admins existam**. Se não houver admin real no ambiente, registrar em `deferred-work.md` (candidato a Story 5.1). **Não** alterar o enum nesta story.
  - [ ] Validar a migration localmente: `supabase db reset` (dev) antes de commitar.

- [ ] **T2 · Atualizar Drizzle schema (AC 3, 4)**
  - [ ] Em [src/db/schema/artists.ts](../../src/db/schema/artists.ts) adicionar:
    ```ts
    bio: text('bio'),
    status: text('status', { enum: ['pending_approval', 'approved', 'rejected'] })
      .default('pending_approval').notNull(),
    privacySettings: jsonb('privacy_settings').$type<ArtistPrivacySettings>().notNull(),
    ```
  - [ ] Exportar `ArtistPrivacySettings` em `src/features/artists/types.ts` (novo arquivo):
    ```ts
    export type PrivacyMode = 'public' | 'collectives_only' | 'private' | 'ghost';
    export type FieldVisibility = 'public' | 'collectives_only' | 'private';
    export type ArtistPrivacySettings = {
      mode: PrivacyMode;
      fields: {
        social_links: FieldVisibility;
        presskit: FieldVisibility;
        bio: FieldVisibility;
        genre: FieldVisibility;
      };
    };
    export const DEFAULT_PRIVACY_SETTINGS: ArtistPrivacySettings = {
      mode: 'public',
      fields: { social_links: 'public', presskit: 'public', bio: 'public', genre: 'public' },
    };
    ```

- [ ] **T3 · Server Action `searchRestrictedArtistByName` (AC 1, 2)**
  - [ ] Em [src/features/artists/actions.ts](../../src/features/artists/actions.ts), **manter** `checkDuplicateArtist` (usada em outros lugares) e adicionar ao lado:
    ```ts
    export type RestrictedArtistHit = {
      id: string; artisticName: string; location: string;
      genrePrimary: string | null; photoUrl: string | null;
    };
    export type SearchRestrictedArtistResult = {
      data: { hit: RestrictedArtistHit | null } | null;
      error: { message: string; code: 'VALIDATION_ERROR' | 'DB_ERROR' } | null;
    };
    export async function searchRestrictedArtistByName(name: string): Promise<SearchRestrictedArtistResult>;
    ```
  - [ ] Regras:
    - Validar `name` via `trimmedStr(2,100,...)` (reusar de `schemas.ts`).
    - Query: `.from(artists).where(and(ilike(artists.artisticName, name), isNull(artists.profileId), eq(artists.status, 'approved'))).limit(1)`.
    - Retornar o primeiro match ou `{ hit: null }`.
    - Try/catch → `DB_ERROR`.
  - [ ] **NÃO** usar wildcards `%...%` — AC exige verificação por nome exato (case-insensitive). Usar `ilike(name)` (sem `%`).

- [ ] **T4 · Server Action `claimArtistProfileAction` (AC 3, 4)**
  - [ ] Em `src/features/artists/actions.ts`:
    ```ts
    export type ClaimArtistState = {
      data: { success: true } | null;
      error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
    };
    export async function claimArtistProfileAction(
      artistId: string,
      _prevState: ClaimArtistState,
      formData: FormData
    ): Promise<ClaimArtistState>;
    ```
  - [ ] Fluxo:
    1. `supabase.auth.getUser()` → `UNAUTHORIZED` se ausente.
    2. Buscar `profile_id` do user (replicar padrão de `saveArtistOnboardingAction`). Falha → `NO_PROFILE`.
    3. Validar `formData` com novo `artistClaimSchema` (bio + socials + presskit + privacy + files opcionais; artisticName **não aceito** — vem do registro).
    4. Validar magic bytes de photo/PDF (reusar `validateMagicBytes` — extrair para helper `src/features/artists/validators.ts` se precisar reusar; **caso contrário** deixar inline).
    5. Query defensiva: `SELECT id, artistic_name, profile_id, status FROM artists WHERE id=artistId`.
       - Not found → `NOT_FOUND`.
       - `profile_id != null` → `ALREADY_CLAIMED`.
       - `status != 'approved'` → `NOT_CLAIMABLE` (proteção contra race).
    6. Checar se já existe outro `artist.profile_id = profileId` → `ALREADY_HAS_ARTIST` (um profile só pode ter um artist por constraint UNIQUE existente — capturar 23505).
    7. Upload de files para `artist_media/{profileId}/...` (mesmo padrão de Story 1.3). Rollback em erro de DB.
    8. `UPDATE artists SET profile_id=..., bio=..., social_links=..., presskit_url=..., photo_url=..., release_pdf_url=..., genre_primary=..., genre_secondary=..., privacy_settings=..., status='pending_approval', updated_at=now() WHERE id=artistId AND profile_id IS NULL` (condição WHERE impede race).
    9. `rowCount === 0` → `ALREADY_CLAIMED` + remover uploads.
    10. Retornar `{ data: { success: true }, error: null }` e **redirect** para `/dashboard/artist` (ou para tela "aguardando aprovação" — ver T8).

- [ ] **T5 · Estender `saveArtistOnboardingAction` (AC 3, 4)**
  - [ ] Adicionar campos **`bio`** (opcional, max 2000 chars) e **`privacySettings`** ao `artistOnboardingSchema` em `src/features/artists/schemas.ts`.
    ```ts
    bio: z.preprocess(v => (typeof v === 'string' ? v.trim() : v),
      z.string().max(2000, 'Máximo de 2000 caracteres').optional()),
    privacySettings: z.preprocess(
      v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } },
      z.object({ /* mode + fields — espelhar ArtistPrivacySettings */ })
    ),
    ```
  - [ ] Criar **schema separado** `artistClaimSchema` que **omite** `artisticName` e `location` (vêm do registro existente) e mantém os demais. Usar `.omit({ artisticName: true, location: true })` ou redeclarar.
  - [ ] No insert, gravar `status: 'pending_approval'`, `bio`, `privacySettings` (defaulta para `DEFAULT_PRIVACY_SETTINGS` se não enviado).
  - [ ] `createOnTheFlyArtistAction` **continua** criando com `status='approved'` (produtores criam perfis visíveis imediatamente) — **não alterar** o comportamento existente dessa action.

- [ ] **T6 · Componente `PrivacySettingsFieldset` (AC 3)**
  - [ ] Criar `src/features/artists/components/privacy-settings-fieldset.tsx` (client component).
  - [ ] UI: radio group (Shadcn `RadioGroup` — instalar se ausente: `npx shadcn@latest add radio-group`) com 4 opções:
    - **Public** (default) — tudo visível.
    - **Collectives Only** — visível apenas para usuários logados com role `produtor` / membros de coletivos.
    - **Private** — apenas o dono e admins vêem os campos sensíveis; nome e localidade permanecem públicos.
    - **Ghost Mode** — perfil retorna 404 na URL pública (comportamento implementado na Story 2.4; aqui apenas persistir a escolha).
  - [ ] Serializar a seleção em um hidden input `<input type="hidden" name="privacySettings" value={JSON.stringify(value)} />` antes de submit.
  - [ ] Para MVP desta story: o seletor define `mode`; os `fields` individuais derivam automaticamente (`public` → todos public; `collectives_only` → social/presskit/bio = collectives_only; `private` → social/presskit/bio = private; `ghost` → mesmos de `private`). UI granular por campo fica deferida (registrar em deferred-work com rationale).
  - [ ] Descrições curtas ao lado de cada opção (Geist Sans, `text-muted-foreground`). Explicar Ghost Mode ("Sua página não será acessível por URL pública. Apenas coletivos podem convidá-lo.").

- [ ] **T7 · Estender `OnboardingForm` (AC 3)**
  - [ ] Adicionar `<Textarea name="bio" maxLength={2000} />` (instalar Shadcn `textarea` se ausente).
  - [ ] Adicionar `<PrivacySettingsFieldset />` ao form.
  - [ ] Adicionar prop opcional `mode: 'create' | 'claim'` (default `'create'`). Em `claim`, `artisticName` e `location` recebem `defaultValue` do registro e ficam `readOnly`; ação do form é `claimArtistProfileAction.bind(null, artistId)`.
  - [ ] **Não duplicar** o componente — reuso por props é obrigatório (anti-pattern: criar `ClaimForm` separado). Rationale: mesma superfície de erro e mesmo schema core.

- [ ] **T8 · Fluxo de onboarding atualizado (AC 1, 2)**
  - [ ] Atualizar [src/app/(dashboard)/onboarding/artist/page.tsx](../../src/app/(dashboard)/onboarding/artist/page.tsx) para máquina de estado com 3 estados:
    - `step: 'search'` → renderiza `SearchBeforeCreate`.
    - `step: 'claim'` → renderiza `ArtistIdentityCard variant='restricted'` + CTA "Reivindicar este perfil" (abre `OnboardingForm mode='claim'` com `artistId` e prefill) + CTA "Não sou eu, criar novo" (vai para `step='create'`).
    - `step: 'create'` → renderiza `OnboardingForm mode='create'` com `initialArtisticName` do search.
  - [ ] Atualizar `SearchBeforeCreate`: substituir `checkDuplicateArtist` por `searchRestrictedArtistByName`. Se `hit` → `onProceed('claim', hit)`. Se null e artista `profile_id != null` existir (já reivindicado) → erro existente ("Já existe um artista com este nome cadastrado"). Caso contrário → `onProceed('create', { artisticName })`.
    - **Atenção:** `searchRestrictedArtistByName` só retorna artistas com `profile_id IS NULL`. Para detectar nomes já reivindicados (conflito duro), **manter** uma chamada adicional a `checkDuplicateArtist` OU mudar `searchRestrictedArtistByName` para retornar `{ hit, conflict: 'claimed' | null }`. Recomendado: estender a action com um segundo campo `conflict` (boolean) indicando `profile_id != null`, evitando duas roundtrips.
  - [ ] Após submit bem-sucedido (claim ou create), a action faz `redirect("/dashboard/artist")`. Criar/ajustar `src/app/(dashboard)/dashboard/artist/page.tsx` para mostrar banner **"Perfil aguardando aprovação"** quando `artist.status === 'pending_approval'`. (Implementar o banner; dashboard completo de artista é fora de escopo.)

- [ ] **T9 · `ArtistIdentityCard` — ativar CTA Claim (AC 2)**
  - [ ] Em [src/features/artists/components/artist-identity-card.tsx](../../src/features/artists/components/artist-identity-card.tsx):
    - Renderizar o botão "Reivindicar este perfil" quando `onClaim` é passado (já reservado na Story 2.2). Nenhuma mudança estrutural.
  - [ ] No fluxo da Story 2.2 (`CommandPalette`), **não** adicionar `onClaim` — comando palette não é o lugar do claim. Lugar do claim é exclusivamente o onboarding.

- [ ] **T10 · Filtro de visibilidade em `searchTalents` (AC 5)**
  - [ ] Em [src/features/search/actions.ts](../../src/features/search/actions.ts) (criado na 2.2), adicionar filtro por `status`:
    - Verificar se o user atual é admin (`profile.role='admin'`). Helper: `isPlatformAdmin(userId)` em `src/features/auth/actions.ts` (criar se não existir) para uso futuro.
    - **Não-admin**: adicionar `eq(artists.status, 'approved')` ao `where`.
    - **Admin**: sem filtro de status.
  - [ ] Ajustar testes existentes de `searchTalents` para cobrir: (a) artista `pending_approval` oculto para user comum, (b) visível para admin, (c) `approved` sempre visível.
  - [ ] Collectives não têm `status` afetado nesta story — manter filtro `eq(collectives.status, 'active')`.

- [ ] **T11 · Testes (AC 1–5)**
  - [ ] `src/features/artists/actions.test.ts` (Vitest) — novos casos:
    - `searchRestrictedArtistByName`: name vazio → VALIDATION_ERROR; nome match exato com `profile_id IS NULL` e `status='approved'` → retorna hit; nome match com `profile_id != null` → `hit=null, conflict=true`; sem match → `hit=null, conflict=false`.
    - `claimArtistProfileAction`: UNAUTHORIZED; NOT_FOUND; ALREADY_CLAIMED (race após primeiro claim); sucesso → `profile_id` gravado + `status='pending_approval'` + bio/privacy persistidos; upload falhou → rollback + sem alteração no row.
    - `saveArtistOnboardingAction`: grava `status='pending_approval'` + `privacy_settings` default + `bio` quando ausente.
  - [ ] `src/features/search/actions.test.ts` — novos casos: artista `pending_approval` invisível para user não-admin; visível para admin.
  - [ ] RTL:
    - `privacy-settings-fieldset.test.tsx`: renderiza 4 radios; mudança atualiza o JSON serializado.
    - Atualizar `onboarding-form` test (se existir; caso contrário, criar cobertura mínima do `mode='claim'` com readonly em `artisticName`).
  - [ ] E2E Playwright (`e2e/onboarding-claim.spec.ts`):
    - Seed: criar artista on-the-fly (via fixture/seed SQL) com `profile_id IS NULL`, `status='approved'`, `artistic_name='Test DJ'`.
    - Login como novo artista → onboarding → buscar "Test DJ" → card "Restricted" visível com CTA → clicar Claim → preencher bio + escolher privacidade Public → submit → redirecionado para `/dashboard/artist` com banner "aguardando aprovação".
    - Segundo cenário: buscar nome que não existe → criar novo → preencher + Ghost Mode → submit → banner pending.

- [ ] **T12 · Regressões e limpeza**
  - [ ] `npm run type-check && npm run lint && npm run test && npm run test:e2e`.
  - [ ] Verificar que `searchTalents` (Story 2.2) continua passando nos testes existentes após adicionar filtro de `status`.
  - [ ] Middleware ([src/middleware.ts](../../src/middleware.ts)) não precisa mudar — protege `/dashboard/*`, claim só ocorre autenticado.
  - [ ] Atualizar `deferred-work.md` com: (a) UI granular por campo de privacy; (b) enum `profiles.role` não inclui `admin` — seed/migration de admin role fica a cargo da Story 5.1; (c) notificação QStash ao admin de novo `pending_approval` — deferir se não trivial.
  - [ ] **Não** criar rotas admin de aprovação — é Story 5.1. Esta story entrega o estado `pending_approval`; a UI de moderação virá depois.

## Dev Notes

### Contexto de negócio

FR9 + FR12 definem o **coração da soberania do artista**: perfis on-the-fly criados por produtores (Story 2.1) se transformam em perfis plenos quando o artista faz **Claim**. A obrigatoriedade de busca prévia (UX-DR8) previne duplicatas e transforma o onboarding em um momento "recompensador" (ver product-brief, persona Zé). Privacy settings garantem o pilar "Dados sensíveis permanecem privados" do PRD ([prd.md:128](../planning-artifacts/prd.md)).

### Arquitetura — guardrails obrigatórios

- **Stack:** idêntica à Story 2.2 — Next 15 + React 19 + Supabase SSR + Drizzle 0.45.2 + Zod 4.3.6 + Shadcn `base-nova` + Vitest 4 + Playwright.
- **Error shape canônico:** `{ data | null, error: { message, code, fieldErrors? } | null }` ([architecture.md:179-181](../planning-artifacts/architecture.md)). Códigos novos introduzidos aqui: `NOT_FOUND`, `ALREADY_CLAIMED`, `NOT_CLAIMABLE`, `ALREADY_HAS_ARTIST`. Reusar `VALIDATION_ERROR`, `UNAUTHORIZED`, `DB_ERROR`, `NO_PROFILE`, `UPLOAD_ERROR`, `DUPLICATE_NAME` dos que já existem.
- **Zod-first:** nenhuma Server Action processa dados sem `safeParse` ([architecture.md:194-196](../planning-artifacts/architecture.md)).
- **RLS:** RLS **não** é cosmético — é a camada de defesa exigida pelo arch ([architecture.md:112-116](../planning-artifacts/architecture.md)). A policy de SELECT atualizada é pré-requisito de AC #5; sem ela, o filtro da action pode ser burlado via cliente Supabase direto.
- **Feature folder pattern** ([architecture.md:240-244](../planning-artifacts/architecture.md)): tudo em `src/features/artists/`. Novos arquivos: `types.ts`, `components/privacy-settings-fieldset.tsx`, `validators.ts` (se extrair magic bytes).

### Reuso obrigatório (NÃO reinventar)

- `trimmedStr(min,max,msg)` em [src/features/artists/schemas.ts:3](../../src/features/artists/schemas.ts).
- `validateMagicBytes` em [src/features/artists/actions.ts:33](../../src/features/artists/actions.ts) — extrair para `validators.ts` **apenas se** for reusado por `claimArtistProfileAction`. Se sim, exportar e importar nos dois. Não duplicar.
- `createClient()` de [src/lib/supabase/server.ts](../../src/lib/supabase/server.ts).
- `ArtistIdentityCard` já declara prop `onClaim` reservada ([implementation-artifacts/2-2-...md:99-101](2-2-busca-global-de-talentos-e-cmd-k.md)). **Ativar**, não criar card novo.
- Upload + rollback pattern de `saveArtistOnboardingAction` ([actions.ts:170-229](../../src/features/artists/actions.ts)) — replicar idêntico em `claimArtistProfileAction`.
- QStash em `src/features/notifications/qstash.ts` — **usar se** for trivial enfileirar "admin notification". Se exigir novo webhook handler, deferir.

### Modelo de dados — estado final de `artists`

| Coluna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid nullable | nullable desde migration 004 |
| `artistic_name` | text, NOT NULL, UNIQUE | — |
| `location` | text, NOT NULL | — |
| `genre_primary` | text nullable | nullable desde 004 |
| `genre_secondary` | text nullable | — |
| `bio` | text nullable | **novo — 005** |
| `social_links` | jsonb nullable | — |
| `presskit_url` | text nullable | — |
| `release_pdf_url` | text nullable | — |
| `photo_url` | text nullable | — |
| `is_verified` | bool, default false, NOT NULL | Semântica legada (Story 1.3); hoje o gate de visibilidade é `status`. `is_verified` permanece para backward compat e "selo neon" da UX-DR7. |
| `status` | text, NOT NULL, default `pending_approval` | **novo — 005** |
| `privacy_settings` | jsonb, NOT NULL, default `{...}` | **novo — 005** |
| `created_at`/`updated_at` | timestamp NOT NULL | — |

### Máquina de estados de `status`

```
(create via onboarding)      pending_approval ── admin approve ──> approved
(create on-the-fly 2.1) ──> approved (já visível — ver migration backfill)
(claim)   approved ──────────> pending_approval ── admin approve ──> approved
                                            └─ admin reject ──> rejected
```

- `is_verified` e `status` **não são redundantes**: `is_verified=true` indica "o perfil tem dono autenticado E foi verificado pela primeira vez pelo admin"; `status` rastreia o ciclo a cada submissão/claim. A aprovação admin (Story 5.1) flipa `status='approved'` e, **na primeira vez**, também `is_verified=true`.

### Por que `approved` é o default de backfill (e não `pending_approval`)

Os artistas existentes em produção (`is_verified=true` da Story 1.3 e on-the-fly da Story 2.1) já são **esperados visíveis**. Default da coluna é `pending_approval` (para novos records), mas o `UPDATE` de backfill força `approved` no legado para não quebrar a busca da Story 2.2. Documentar no Change Log.

### Reuso vs novo schema de privacy

`privacy_settings` é jsonb para dar **flexibilidade sem migrations** futuras (adicionar novo campo à granularidade). Validar com Zod em **toda** ação que grava o valor; **nunca** confiar no shape bruto do jsonb retornado do DB — Zod parse na leitura também, para blindar contra legado corrompido.

### UX-DR7 — variantes do `ArtistIdentityCard` nesta story

| Variante | Quando | Elementos |
|---|---|---|
| `restricted` | resultado do search-before-create quando `profile_id IS NULL` | Badge "Restricted" + **CTA "Reivindicar este perfil"** (onClaim ativado) |
| `verified`  | `is_verified=true` + `status='approved'` | Neon Seal (já implementado) |

### Autorização

- Artistas logados: podem reivindicar **qualquer** artista com `profile_id IS NULL` (MVP — modelo de convite por email fica em deferred). O admin é quem valida que é a pessoa certa via `status='pending_approval'`.
- Produtores logados: **não podem** reivindicar perfis de artistas (role check na action — recusa com `FORBIDDEN`). Podem criar on-the-fly (Story 2.1) — comportamento atual preservado.
- Platform admins: visibilidade total (RLS + filtro em `searchTalents`).

### Segurança — pontos críticos

- **Race no claim:** dois usuários poderiam clicar Claim no mesmo perfil simultaneamente. Mitigação: `UPDATE ... WHERE profile_id IS NULL` retorna `rowCount=0` no segundo — fazer early return com `ALREADY_CLAIMED`.
- **Escalation via privacy jsonb:** nunca deixar o cliente escrever `privacy_settings` diretamente — **sempre** via schema Zod que whitelista `mode` e `fields`. Evita injeção de chaves arbitrárias.
- **RLS bypass:** service_role key burla RLS. Drizzle usa a conexão direta de postgres — **não** o cliente RLS. Por isso o filtro de `status` **também** vai nas Server Actions (defesa em profundidade).

### Previous Story Intelligence

**Story 2.1** ([2-1-criacao-de-perfil-on-the-fly-e-notificacao.md](2-1-criacao-de-perfil-on-the-fly-e-notificacao.md)):
- Deferred: "Missing `created_by`/`collective_id` em artistas on-the-fly — endereçar na story de claim (2.3) quando o link ao perfil do artista for estabelecido." → **Esta story endereça em parte:** `claimArtistProfileAction` preenche `profile_id`. `created_by` e `collective_id` continuam deferidos (moderação admin, não claim).
- `createOnTheFlyArtistAction` deve permanecer intocada. Não reintroduzir checagens.
- Feature folder `src/features/notifications/` existe — candidato a hook para notificação de pending_approval ao admin.

**Story 2.2** ([2-2-busca-global-de-talentos-e-cmd-k.md](2-2-busca-global-de-talentos-e-cmd-k.md)):
- `ArtistIdentityCard` tem prop `onClaim` reservada — **ativar**, não criar card novo.
- `searchTalents` retorna TODOS os artistas (incluindo `is_verified=false`). A mudança introduzida aqui é **adicionar** filtro de `status` — cuidado para não regredir nos testes existentes.
- Review findings da 2.2 corrigiram wildcard injection em LIKE; padrão `.replace(/[%_]/g, '\\$&')` está estabelecido — **não** reintroduzir concatenação crua.
- Retrospectiva Épico 1 sugere índice em `artists.artistic_name` — criar índice em `status` agora; índice em `artistic_name` fica deferido se a busca 2.2 estiver aceitável.

**Story 1.3** ([1-3-onboarding-de-artista-perfil-essencial.md](1-3-onboarding-de-artista-perfil-essencial.md)):
- Upload + rollback de storage com `artist_media/{profileId}/` — replicar padrão. Não mudar bucket.
- Magic-byte validation obrigatória; não confiar em `Content-Type`.

**Retrospectiva DevOps/Infra** ([epic-devops-infra-retro-2026-04-22.md](epic-devops-infra-retro-2026-04-22.md)):
- Playwright E2E roda contra `npm run build && npm start`. Testar o fluxo de claim em modo build (RSC dinâmico + Server Actions).

### Git Intelligence (últimos 5 commits relevantes)

```
ee759ca Merge PR #10 Story 2.2 (Cmd+K + ArtistIdentityCard com onClaim reservado)
70a9e6d fix(story-2-2): corrigir teste E2E de onboarding
26751bc fix(story-2-2): corrigir bugs de code review (shouldFilter, wildcard, res.error)
8ec9eab feat(story-2-2): busca global + Cmd+K
4859515 Merge PR #9 story 2.1
```

Esta story é a **terceira mudança consecutiva em `src/features/artists/actions.ts`** — atenção redobrada em preservar ordem/idioma de funções já consolidadas (`checkDuplicateArtist`, `saveArtistOnboardingAction`, `createOnTheFlyArtistAction`). Adicionar as novas actions ao final, preservando imports organizados.

### Tech Info — versões críticas

- **Shadcn `radio-group` / `textarea`**: instalar via `npx shadcn@latest add radio-group textarea` (style `base-nova`).
- **Drizzle 0.45.2**: `isNull()` e `and()`/`or()` disponíveis em `drizzle-orm`.
- **Supabase SSR**: RLS com `auth.uid()` dentro da policy é a forma canônica ([docs Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)).
- **Zod 4.3.6**: `.omit()` preserva preprocessors; usar para derivar `artistClaimSchema` de `artistOnboardingSchema`.

### Project Structure Notes

Aderente à árvore em [architecture.md:220-257](../planning-artifacts/architecture.md). Novos/alterados:

- `supabase/migrations/005_artists_claim_privacy.sql` — **novo**.
- `src/db/schema/artists.ts` — **alterado** (3 colunas novas).
- `src/features/artists/types.ts` — **novo** (`ArtistPrivacySettings`, defaults).
- `src/features/artists/actions.ts` — **alterado** (2 novas actions; `saveArtistOnboardingAction` estendida).
- `src/features/artists/schemas.ts` — **alterado** (bio, privacySettings, `artistClaimSchema`).
- `src/features/artists/components/privacy-settings-fieldset.tsx` — **novo**.
- `src/features/artists/components/onboarding-form.tsx` — **alterado** (bio, privacy, `mode` prop).
- `src/features/artists/components/search-before-create.tsx` — **alterado** (nova action).
- `src/app/(dashboard)/onboarding/artist/page.tsx` — **alterado** (máquina de estado 3 steps).
- `src/app/(dashboard)/dashboard/artist/page.tsx` — **alterado** (banner pending).
- `src/features/search/actions.ts` — **alterado** (filtro de status).
- `src/components/ui/radio-group.tsx`, `src/components/ui/textarea.tsx` — **novos via Shadcn CLI**.
- Testes: `actions.test.ts` (estendido), `search/actions.test.ts` (estendido), `privacy-settings-fieldset.test.tsx` (novo), `e2e/onboarding-claim.spec.ts` (novo).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/prd.md#FR9,FR12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-Security,#Data-Architecture,#Format-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR7,UX-DR8]
- [Source: _bmad-output/implementation-artifacts/2-1-criacao-de-perfil-on-the-fly-e-notificacao.md]
- [Source: _bmad-output/implementation-artifacts/2-2-busca-global-de-talentos-e-cmd-k.md]
- [Source: _bmad-output/implementation-artifacts/1-3-onboarding-de-artista-perfil-essencial.md]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]
- [Source: src/features/artists/actions.ts, src/features/artists/schemas.ts, src/features/artists/components/onboarding-form.tsx, src/features/artists/components/search-before-create.tsx]
- [Source: src/features/search/actions.ts]
- [Source: src/db/schema/artists.ts, src/db/schema/auth.ts]
- [Source: src/middleware.ts, src/lib/supabase/server.ts]
- [Source: supabase/migrations/000_create_tables.sql, 003_artists_unique_rls.sql, 004_nullable_profile_id_genre_primary.sql]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Review Findings

### Change Log

- 2026-04-24: Story criada via `/bmad-create-story 2.3`. Escopo: migration 005 (status + bio + privacy_settings + RLS atualizado), `searchRestrictedArtistByName`, `claimArtistProfileAction`, extensão de `saveArtistOnboardingAction` + `OnboardingForm`, `PrivacySettingsFieldset`, máquina de estado de onboarding 3-steps, filtro de visibilidade `status='approved'` em `searchTalents`, ativação do CTA `onClaim` em `ArtistIdentityCard`. Status → ready-for-dev.
