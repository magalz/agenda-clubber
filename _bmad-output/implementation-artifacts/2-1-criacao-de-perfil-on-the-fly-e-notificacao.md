# Story 2.1: Criação de Perfil "On-the-Fly" e Notificação

Status: ready-for-dev

**Epic:** 2 — Hub de Talentos e Soberania do Artista (Claim)
**FRs:** FR11, FR27
**Story ID:** 2.1
**Story Key:** `2-1-criacao-de-perfil-on-the-fly-e-notificacao`

> **Escopo desta story (decisão de planejamento confirmada):**
> 1. **Backend-first, sem UI de acionamento.** Entrega schema change + migration + Server Action + API route (consumer QStash) + testes. A superfície visual (CTA "Add New Artist (Restricted)") fica para Story 2.2 (Cmd+K) ou Épico 3 (line-up de evento). Não criar form visual nesta story.
> 2. **E-mail via enqueue QStash com consumer stub.** O consumer valida assinatura QStash e **loga** o payload — NÃO integrar provedor transacional agora. Envio real entra em story futura dedicada.

---

## Story

As a **Collective Admin**,
I want to **add an artist to my event even if they are not registered**,
so that **I can complete my event planning without delays**.

## Acceptance Criteria

Verbatim de `_bmad-output/planning-artifacts/epics.md:318–331`:

1. **Given** an admin creating an event **When** they search for an artist and don't find them, they can "Add New Artist (Restricted)" **Then** only "Nome Artístico" and "Localidade" are required to create the record.
2. **And** a restricted profile is created in the `artists` table with `is_verified: false`.
3. **And** if an email is provided, an automatic invitation is sent to the artist via email service.

**Interpretação operacional (dado o escopo backend-first aprovado):**

- AC #1 será satisfeito pelo contrato da Server Action + API route (input mínimo = `artisticName` + `location`, `email` opcional). Sem CTA/UI nesta story.
- AC #2 exige `is_verified=false` persistido e `profile_id` **nulo** (on-the-fly artist NÃO tem `auth.user`).
- AC #3 é satisfeito pelo enqueue de uma mensagem no QStash quando `email` presente; consumer stub valida assinatura e loga. Envio real fica fora do escopo.

## Tasks / Subtasks

- [ ] **T1 · Schema & migration (AC 2)**
  - [ ] Em `src/db/schema/artists.ts`: tornar `profileId` **nullable** (remover `.notNull()`; manter `.unique()` para preservar relação 1:1 no claim futuro).
  - [ ] Gerar migration: `npx drizzle-kit generate` → arquivo em `supabase/migrations/`.
  - [ ] Validar localmente: `npx drizzle-kit migrate` (ou `supabase db push` conforme DI.5).
  - [ ] Atualizar `src/db/schema/schema.test.ts` se existir cobertura do campo.

- [ ] **T2 · Schema Zod on-the-fly (AC 1)**
  - [ ] Em `src/features/artists/schemas.ts`: adicionar `createOnTheFlyArtistSchema` reutilizando `trimmedStr` — campos: `artisticName` (min 2, max 100), `location` (min 2, max 100), `email` opcional (`z.union([z.literal(""), z.string().email()])`).
  - [ ] Exportar `CreateOnTheFlyArtistInput` type.

- [ ] **T3 · Server Action `createOnTheFlyArtistAction` (AC 1, 2, 3)**
  - [ ] Em `src/features/artists/actions.ts`: nova action com assinatura `(prevState, formData) => Promise<CreateOnTheFlyArtistState>` seguindo padrão `{ data, error: { message, code, fieldErrors? } }` já estabelecido.
  - [ ] Autenticação: `createClient()` + `supabase.auth.getUser()`; rejeitar com `UNAUTHORIZED` se sem user.
  - [ ] Autorização: verificar que user é admin de **algum** coletivo (`collective_members` com `role='collective_admin'`). Código: `FORBIDDEN` se não for.
  - [ ] Validação: `createOnTheFlyArtistSchema.safeParse` → retornar `VALIDATION_ERROR` com `fieldErrors` em caso de falha.
  - [ ] Duplicidade: reutilizar `checkDuplicateArtist(artisticName)`; se duplicado → `DUPLICATE_NAME`.
  - [ ] Insert: `db.insert(artists).values({ artisticName, location, genrePrimary: '', ...})` — **atenção**: schema atual tem `genrePrimary: .notNull()`. Ajustar um dos dois:
    - **Preferido:** na migration, tornar `genrePrimary` também nullable (artistas on-the-fly só têm nome + localidade públicos — FR11).
    - Alternativa: persistir `genrePrimary: ''` (string vazia) — rejeitado pois viola FR11 (dados inventados).
    - Decisão: **migration deve tornar `genrePrimary` nullable** junto com `profileId`. `profileId: null`, `isVerified: false`.
  - [ ] Captura erro Postgres `23505` (unique violation) em paralelo como segunda camada de defesa.
  - [ ] Após insert bem-sucedido, se `email` presente → `enqueueArtistClaimInvitation({ artistId, email, artisticName })`. Erro de enqueue **não deve** reverter o insert — logar via Sentry e prosseguir com `data: { success: true, artistId, emailQueued: false }`.
  - [ ] Retornar `{ data: { success: true, artistId, emailQueued }, error: null }`. **Não** redirecionar (esta action não tem UI de origem).

- [ ] **T4 · Cliente QStash (`src/features/notifications/qstash.ts`) (AC 3)**
  - [ ] Adicionar dependência: `npm i @upstash/qstash`.
  - [ ] Exportar `qstashClient` inicializado com `process.env.QSTASH_TOKEN`.
  - [ ] Exportar `enqueueArtistClaimInvitation(payload: { artistId: string; email: string; artisticName: string })` que chama `qstashClient.publishJSON({ url: <base>/api/webhooks/notifications/artist-claim, body: payload })`.
  - [ ] `<base>` deve vir de `process.env.NEXT_PUBLIC_SITE_URL` (ou equivalente já existente). Em dev, exigir túnel público (documentar no story notes).
  - [ ] Nunca lançar: retornar `{ queued: boolean; error?: string }` para action tratar.

- [ ] **T5 · Consumer webhook `/api/webhooks/notifications/artist-claim` (AC 3)**
  - [ ] Criar `src/app/api/webhooks/notifications/artist-claim/route.ts`.
  - [ ] `POST` handler envolvido em `verifySignatureAppRouter` de `@upstash/qstash/nextjs` (assinatura QStash v2).
  - [ ] Parse do body; validar com Zod (`artistId: uuid, email: email, artisticName: string`).
  - [ ] **Stub behavior:** logar payload estruturado via `console.info` + Sentry breadcrumb (`category: 'artist-claim-invitation', data: {...}`). Retornar `200 { ok: true, stub: true }`.
  - [ ] **TODO explícito no código:** comentário `// TODO(story-2.x): replace stub with Resend/transactional provider integration`.

- [ ] **T6 · Env vars & docs (AC 3)**
  - [ ] `.env.example`: adicionar `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` com comentários (painel upstash.com/qstash).
  - [ ] `README.md` (seção "Local Setup" criada em DI.2): adicionar nota sobre QStash em dev requerer túnel público OU rodar apenas verificação de assinatura offline em testes.

- [ ] **T7 · Testes (AC 1, 2, 3)**
  - [ ] `src/features/artists/actions.test.ts`: estender com casos:
    - ✅ happy path com e-mail → `emailQueued: true`, artist persistido com `profileId=null, isVerified=false, genrePrimary=null`.
    - ✅ happy path sem e-mail → `emailQueued: false`, sem chamada ao QStash.
    - ✅ validação: nome < 2 chars → `VALIDATION_ERROR` com `fieldErrors.artisticName`.
    - ✅ duplicidade: nome existente → `DUPLICATE_NAME`, sem insert, sem enqueue.
    - ✅ unauth: sem user → `UNAUTHORIZED`.
    - ✅ não-admin: user sem `collective_admin` em coletivo ativo → `FORBIDDEN`.
    - ✅ falha de enqueue → insert persiste, retorna `emailQueued: false`, Sentry capture chamado.
  - [ ] Mock QStash via MSW (já instalado em devDeps) ou spy direto.
  - [ ] Teste unitário do consumer: payload inválido → 400; payload válido → 200 com `stub: true`.
  - [ ] **Sem E2E nesta story** (não há UI).

## Dev Notes

### Contexto de negócio
Produtores precisam completar line-ups sem esperar o cadastro do artista (FR11). O perfil restrito exibe apenas Nome + Localidade publicamente, preservando soberania de dados até o Claim (Épico 2 completo). FR27 garante que o artista saiba que existe um perfil a reivindicar.

### Arquitetura — guardrails obrigatórios

- **Stack:** Next.js 15 (App Router) + Supabase SSR + Drizzle ORM 0.45.2 + Zod 4.3.6 + Vitest 4 + MSW 2 (ver `package.json`).
- **Zod-first** (`_bmad-output/planning-artifacts/architecture.md`): nenhuma Server Action ou API Route pode processar dados sem `zod.parse()`/`safeParse()`.
- **Drizzle migrations** saem em `supabase/migrations/` (ver `drizzle.config.ts`). DI.5 garante que migrations rodam em CI contra branch Supabase do PR.
- **Notificações assíncronas:** arquitetura define **Upstash QStash** como fila oficial. Envio síncrono é proibido.
- **Feature folder pattern** estabelecido em Stories 1.3/1.4: `src/features/<domain>/{actions.ts, schemas.ts, components/}`. Notificações ficam em `src/features/notifications/`.
- **Error shape canônico** (ver `src/features/artists/actions.ts`): `{ data | null, error: { message, code, fieldErrors? } | null }`. Códigos usados: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `DUPLICATE_NAME`, `DB_ERROR`, `NO_PROFILE`, `ALREADY_EXISTS`. Novo código: **`FORBIDDEN`** para não-admin.

### Reuso obrigatório (NÃO reinventar)

- `checkDuplicateArtist(name)` em [src/features/artists/actions.ts:11](../../src/features/artists/actions.ts) — busca `ilike` no `artistic_name`.
- `trimmedStr(min, max, msg)` em [src/features/artists/schemas.ts:3](../../src/features/artists/schemas.ts) — preprocessor Zod para trim + min/max.
- Padrão de `state` com `fieldErrors` do `safeParse().error.flatten().fieldErrors` — ver `saveArtistOnboardingAction`.
- Client Supabase server-side: `createClient()` de [src/lib/supabase/server.ts](../../src/lib/supabase/server.ts).
- Sentry wrapper: [src/lib/sentry.ts](../../src/lib/sentry.ts).

### Schema atual vs. mudança

**Atual** ([src/db/schema/artists.ts](../../src/db/schema/artists.ts)):
```ts
profileId: uuid('profile_id').references(() => profiles.id).notNull().unique(),
artisticName: text('artistic_name').notNull().unique(),
location: text('location').notNull(),
genrePrimary: text('genre_primary').notNull(),
```

**Mudança requerida:**
```ts
profileId: uuid('profile_id').references(() => profiles.id).unique(), // nullable
artisticName: text('artistic_name').notNull().unique(),
location: text('location').notNull(),
genrePrimary: text('genre_primary'), // nullable — on-the-fly não tem
```

**Migration SQL esperada:**
```sql
ALTER TABLE artists ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE artists ALTER COLUMN genre_primary DROP NOT NULL;
```

**Regressão a evitar:** `saveArtistOnboardingAction` (onboarding real, Story 1.3) deve continuar persistindo `profileId` e `genrePrimary` preenchidos — verificar em teste de regressão.

### Autorização — regra de negócio

Só **collective_admin ativo** pode criar on-the-fly. Query sugerida:
```ts
const isAdmin = await db
  .select({ id: collectiveMembers.id })
  .from(collectiveMembers)
  .innerJoin(profiles, eq(profiles.id, collectiveMembers.profileId))
  .where(and(eq(profiles.userId, user.id), eq(collectiveMembers.role, 'collective_admin')))
  .limit(1);
if (!isAdmin.length) return { data: null, error: { message: 'Apenas admins de coletivo', code: 'FORBIDDEN' } };
```
RLS opcional (`architecture.md` menciona), mas esta checagem na action é obrigatória.

### Contrato do payload QStash

```ts
type ArtistClaimInvitationPayload = {
  artistId: string;     // uuid
  email: string;        // validado
  artisticName: string;
};
```

### Referência à UX (preparação futura)

UX-DR7 (`ux-design-specification.md`) define o **Artist Identity Card** com variantes `Verified` (selo neon) vs. `Unclaimed` (CTA de claim). Esta story **não** implementa o card — apenas garante que o registro criado terá `is_verified=false` para a variante "Unclaimed" funcionar em 2.2/2.4.

### Previous Story Intelligence

**Story 1.4** (`1-4-onboarding-de-produtor-criacao-de-coletivo.md`):
- Padrão `createCollectiveAction` com Zod + Drizzle validado. Reusar estrutura.
- Bridging table `collective_members` com `role='collective_admin'` já existe — base da checagem de autorização.

**Story 1.3** (`1-3-onboarding-de-artista-perfil-essencial.md`):
- Padrão de upload + rollback de storage NÃO se aplica (on-the-fly não tem upload).
- `saveArtistOnboardingAction` mostra o padrão canônico de state/error/fieldErrors a seguir.

**Retrospectiva Épico 1** (`epic-1-retro-2026-04-17.md`):
- `is_verified: false` já mapeado como premissa do claim flow — confirma AC #2.
- Índice em `artists.artistic_name` sugerido para 2.2 (não obrigatório aqui, mas se a migration já alterar a tabela, considerar adicionar no mesmo arquivo).

**Retrospectiva DevOps/Infra** (`epic-devops-infra-retro-2026-04-22.md`):
- Pipeline CI/CD verde é gate de qualidade; branch protection ativa. Migration será validada automaticamente na Supabase Branch do PR (DI.5).

### Git Intelligence (últimos 5 commits)

```
3e264aa Merge PR #6 retro/devops-infra-2026-04-22
b053059 retro(devops): retrospectiva do épico DevOps/Infra + fixes
0a41d01 Merge PR #4 fix/root-redirect-login
6b84d15 fix(root): raiz → login
09b9854 Merge PR #3 claude/di-5-supabase-branching
```
Nenhum commit recente em `src/features/artists/` — baseline é o Story 1.3 original.

### Tech Info — versões críticas

- **Drizzle ORM 0.45.2** + **drizzle-kit 0.31.10**: suportam `ALTER COLUMN DROP NOT NULL` via `drizzle-kit generate` automaticamente.
- **@upstash/qstash** (não instalado): usar versão estável atual. Helper `verifySignatureAppRouter` de `@upstash/qstash/nextjs` é a API recomendada para Next 15 App Router (verificação de assinatura v2 com `QSTASH_CURRENT_SIGNING_KEY` + `QSTASH_NEXT_SIGNING_KEY` para rotação).
- **Next 15 + React 19**: Server Actions e Route Handlers continuam o padrão.

### Project Structure Notes

Aderente. Novos caminhos:
- `src/features/artists/actions.ts` — estender (não criar novo arquivo).
- `src/features/artists/schemas.ts` — estender.
- `src/features/notifications/` — **novo diretório**; convenção `features/<domain>/` já está estabelecida.
- `src/app/api/webhooks/notifications/artist-claim/route.ts` — **novo**; segue o padrão App Router de Route Handlers.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR11,FR27]
- [Source: _bmad-output/planning-artifacts/architecture.md#Notificações-QStash]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR7]
- [Source: _bmad-output/implementation-artifacts/1-3-onboarding-de-artista-perfil-essencial.md]
- [Source: _bmad-output/implementation-artifacts/1-4-onboarding-de-produtor-criacao-de-coletivo.md]
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md]
- [Source: _bmad-output/implementation-artifacts/epic-devops-infra-retro-2026-04-22.md]
- [Source: src/features/artists/actions.ts, src/features/artists/schemas.ts, src/db/schema/artists.ts]
- [Source: drizzle.config.ts]

## Dev Agent Record

### Agent Model Used

_(a ser preenchido pelo dev agent)_

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-04-23: Story criada via `/bmad-create-story 2.1`. Escopo: backend-first (sem UI), e-mail como enqueue QStash + consumer stub. Status → ready-for-dev.
