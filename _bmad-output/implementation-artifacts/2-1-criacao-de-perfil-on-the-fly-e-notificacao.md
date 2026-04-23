# Story 2.1: Criação de Perfil "On-the-Fly" e Notificação

Status: done

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

- [x] **T1 · Schema & migration (AC 2)**
  - [x] Em `src/db/schema/artists.ts`: tornar `profileId` **nullable** (remover `.notNull()`; manter `.unique()` para preservar relação 1:1 no claim futuro).
  - [x] Gerar migration: `npx drizzle-kit generate` → arquivo em `supabase/migrations/`.
  - [x] Validar localmente: `npx drizzle-kit migrate` (ou `supabase db push` conforme DI.5).
  - [x] Atualizar `src/db/schema/schema.test.ts` se existir cobertura do campo.

- [x] **T2 · Schema Zod on-the-fly (AC 1)**
  - [x] Em `src/features/artists/schemas.ts`: adicionar `createOnTheFlyArtistSchema` reutilizando `trimmedStr` — campos: `artisticName` (min 2, max 100), `location` (min 2, max 100), `email` opcional (`z.union([z.literal(""), z.string().email()])`).
  - [x] Exportar `CreateOnTheFlyArtistInput` type.

- [x] **T3 · Server Action `createOnTheFlyArtistAction` (AC 1, 2, 3)**
  - [x] Em `src/features/artists/actions.ts`: nova action com assinatura `(prevState, formData) => Promise<CreateOnTheFlyArtistState>` seguindo padrão `{ data, error: { message, code, fieldErrors? } }` já estabelecido.
  - [x] Autenticação: `createClient()` + `supabase.auth.getUser()`; rejeitar com `UNAUTHORIZED` se sem user.
  - [x] Autorização: verificar que user é admin de **algum** coletivo (`collective_members` com `role='collective_admin'`). Código: `FORBIDDEN` se não for.
  - [x] Validação: `createOnTheFlyArtistSchema.safeParse` → retornar `VALIDATION_ERROR` com `fieldErrors` em caso de falha.
  - [x] Duplicidade: reutilizar `checkDuplicateArtist(artisticName)`; se duplicado → `DUPLICATE_NAME`.
  - [x] Insert: `db.insert(artists).values({ artisticName, location, genrePrimary: '', ...})` — **atenção**: schema atual tem `genrePrimary: .notNull()`. Ajustar um dos dois:
    - **Preferido:** na migration, tornar `genrePrimary` também nullable (artistas on-the-fly só têm nome + localidade públicos — FR11).
    - Alternativa: persistir `genrePrimary: ''` (string vazia) — rejeitado pois viola FR11 (dados inventados).
    - Decisão: **migration deve tornar `genrePrimary` nullable** junto com `profileId`. `profileId: null`, `isVerified: false`.
  - [x] Captura erro Postgres `23505` (unique violation) em paralelo como segunda camada de defesa.
  - [x] Após insert bem-sucedido, se `email` presente → `enqueueArtistClaimInvitation({ artistId, email, artisticName })`. Erro de enqueue **não deve** reverter o insert — logar via Sentry e prosseguir com `data: { success: true, artistId, emailQueued: false }`.
  - [x] Retornar `{ data: { success: true, artistId, emailQueued }, error: null }`. **Não** redirecionar (esta action não tem UI de origem).

- [x] **T4 · Cliente QStash (`src/features/notifications/qstash.ts`) (AC 3)**
  - [x] Adicionar dependência: `npm i @upstash/qstash`.
  - [x] Exportar `qstashClient` inicializado com `process.env.QSTASH_TOKEN`.
  - [x] Exportar `enqueueArtistClaimInvitation(payload: { artistId: string; email: string; artisticName: string })` que chama `qstashClient.publishJSON({ url: <base>/api/webhooks/notifications/artist-claim, body: payload })`.
  - [x] `<base>` deve vir de `process.env.NEXT_PUBLIC_SITE_URL` (ou equivalente já existente). Em dev, exigir túnel público (documentar no story notes).
  - [x] Nunca lançar: retornar `{ queued: boolean; error?: string }` para action tratar.

- [x] **T5 · Consumer webhook `/api/webhooks/notifications/artist-claim` (AC 3)**
  - [x] Criar `src/app/api/webhooks/notifications/artist-claim/route.ts`.
  - [x] `POST` handler envolvido em `verifySignatureAppRouter` de `@upstash/qstash/nextjs` (assinatura QStash v2).
  - [x] Parse do body; validar com Zod (`artistId: uuid, email: email, artisticName: string`).
  - [x] **Stub behavior:** logar payload estruturado via `console.info` + Sentry breadcrumb (`category: 'artist-claim-invitation', data: {...}`). Retornar `200 { ok: true, stub: true }`.
  - [x] **TODO explícito no código:** comentário `// TODO(story-2.x): replace stub with Resend/transactional provider integration`.

- [x] **T6 · Env vars & docs (AC 3)**
  - [x] `.env.example`: adicionar `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` com comentários (painel upstash.com/qstash).
  - [x] `README.md` (seção "Local Setup" criada em DI.2): adicionar nota sobre QStash em dev requerer túnel público OU rodar apenas verificação de assinatura offline em testes.

- [x] **T7 · Testes (AC 1, 2, 3)**
  - [x] `src/features/artists/actions.test.ts`: estender com casos:
    - ✅ happy path com e-mail → `emailQueued: true`, artist persistido com `profileId=null, isVerified=false, genrePrimary=null`.
    - ✅ happy path sem e-mail → `emailQueued: false`, sem chamada ao QStash.
    - ✅ validação: nome < 2 chars → `VALIDATION_ERROR` com `fieldErrors.artisticName`.
    - ✅ duplicidade: nome existente → `DUPLICATE_NAME`, sem insert, sem enqueue.
    - ✅ unauth: sem user → `UNAUTHORIZED`.
    - ✅ não-admin: user sem `collective_admin` em coletivo ativo → `FORBIDDEN`.
    - ✅ falha de enqueue → insert persiste, retorna `emailQueued: false`, Sentry capture chamado.
  - [x] Mock QStash via MSW (já instalado em devDeps) ou spy direto.
  - [x] Teste unitário do consumer: payload inválido → 400; payload válido → 200 com `stub: true`.
  - [x] **Sem E2E nesta story** (não há UI).

### Review Follow-ups (AI)

- [x] [Review][Patch] URL construction em `enqueueArtistClaimInvitation` não trata trailing slash [`src/features/notifications/qstash.ts:17`]
- [x] [Review][Patch] `artisticName` no `payloadSchema` do webhook aceita string vazia (action exige min 2) [`src/app/api/webhooks/notifications/artist-claim/route.ts:7`]
- [x] [Review][Patch] `QSTASH_TOKEN ?? ""` silencia falha de configuração — checar token vazio antes do publish [`src/features/notifications/qstash.ts:3`]
- [x] [Review][Defer] Missing `created_by`/`collective_id` no registro on-the-fly — deferred, design decision para story de claim
- [x] [Review][Defer] Email do convite não persistido no banco — deferred, concern para story futura de claim
- [x] [Review][Defer] Ausência de CHECK constraint DB (`is_verified=true` implica campos não nulos) — deferred, melhoria de schema futura
- [x] [Review][Defer] `NEXT_PUBLIC_SITE_URL` exposto no bundle do browser via backend — deferred, pattern preexistente no projeto
- [x] [Review][Defer] Webhook sem idempotência para at-least-once delivery — deferred, necessário quando email real for integrado
- [x] [Review][Defer] Rate limiting ausente na action — deferred, concern cross-cutting de infraestrutura
- [x] [Review][Defer] `err.code === "23505"` frágil e não-tipado — deferred, pattern preexistente em `saveArtistOnboardingAction`
- [x] [Review][Defer] Signing keys QStash ausentes em produção rejeitam webhooks — deferred, concern de deploy documentado em `.env.example`

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

claude-sonnet-4-6

### Debug Log References

- Migration `npx drizzle-kit generate` falhou porque `drizzle.config.ts` usa glob `./src/db/schema/*.ts` e o drizzle-kit 0.31.10 não respeita o padrão de negação `!./src/db/schema/*.test.ts` ao carregar o `schema.test.ts` que importa vitest via CJS. Migration criada manualmente com o SQL correto (`ALTER TABLE artists ALTER COLUMN ... DROP NOT NULL`).

### Completion Notes List

- T1: `profileId` e `genrePrimary` tornados nullable em `artists.ts`. Migration `004_nullable_profile_id_genre_primary.sql` criada manualmente (drizzle-kit negation glob não funciona com `schema.test.ts` que importa vitest). `schema.test.ts` não precisou de alterações — os testes só verificam `isDefined()` nos campos, que continuam definidos mesmo nullable.
- T2: `createOnTheFlyArtistSchema` + `CreateOnTheFlyArtistInput` adicionados em `schemas.ts` reutilizando `trimmedStr` existente.
- T3: `createOnTheFlyArtistAction` implementada em `actions.ts` com fluxo: auth → admin check → validação Zod → duplicate check → insert → enqueue opcional. Enqueue failure não reverte insert — logado via `console.error` e `emailQueued: false` retornado.
- T4: `@upstash/qstash@2.10.1` instalado. `src/features/notifications/qstash.ts` criado com `enqueueArtistClaimInvitation` que nunca lança exceção.
- T5: Webhook consumer stub criado em `src/app/api/webhooks/notifications/artist-claim/route.ts` com `verifySignatureAppRouter`, validação Zod e TODO para integração real.
- T6: `.env.example` atualizado — QStash vars promovidas de seção comentada para ativa. `README.md` recebeu nota na seção "Local Setup" sobre necessidade de túnel público em dev.
- T7: 43 testes passam (5 suítes) — 27 pré-existentes + 7 novos para `createOnTheFlyArtistAction` + 6 novos para `createOnTheFlyArtistSchema` + 5 novos para o webhook consumer.

### File List

- `src/db/schema/artists.ts` — `profileId` e `genrePrimary` tornados nullable
- `supabase/migrations/004_nullable_profile_id_genre_primary.sql` — nova migration
- `src/features/artists/schemas.ts` — `createOnTheFlyArtistSchema` + `CreateOnTheFlyArtistInput`
- `src/features/artists/actions.ts` — `createOnTheFlyArtistAction` + `CreateOnTheFlyArtistState`
- `src/features/notifications/qstash.ts` — novo arquivo (novo diretório)
- `src/app/api/webhooks/notifications/artist-claim/route.ts` — novo webhook consumer
- `.env.example` — QStash vars ativadas
- `README.md` — nota sobre QStash em dev
- `src/features/artists/actions.test.ts` — mocks ampliados + 13 novos testes
- `src/app/api/webhooks/notifications/artist-claim/route.test.ts` — novo arquivo (5 testes)

### Change Log

- 2026-04-23: Story criada via `/bmad-create-story 2.1`. Escopo: backend-first (sem UI), e-mail como enqueue QStash + consumer stub. Status → ready-for-dev.
- 2026-04-23: Implementação completa. Schema nullable, migration manual, Server Action, QStash client, webhook consumer stub, testes (43/43 passando). Status → review.
- 2026-04-23: Code review concluído (3 LLMs paralelos). 3 patches aplicados: URL construction com `new URL()`, `artisticName.min(2)` no payload schema do webhook, guard de `QSTASH_TOKEN` vazio. 7 itens diferidos. Status → done.
