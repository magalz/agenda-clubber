# Deferred Work

## Deferred from: code review de 1-0-inicializacao-do-projeto-e-infraestrutura-base (2026-04-16)

- **RLS ausente em `collectives`** [`src/db/schema/collectives.ts`] — A tabela `collectives` foi criada sem migration de RLS. Pertence ao escopo da Story 1.4 (onboarding de produtor / criação de coletivo).
- **`src/features/` não aparece no diff** — Estrutura de diretórios feature-based pode ter sido criada como pastas vazias (não rastreadas pelo git). Verificar manualmente se `src/features/{auth,artists,calendar}` existem.
- **Versões de dependências não verificáveis** — `package.json` não está no diff. Validar manualmente: Next.js 15+, Drizzle 0.45.2, Vitest 4.1.4, Playwright 1.59.1.
- **`.env.example` ausente** — Boa prática para onboarding de novos devs. Criar template com as variáveis necessárias (sem valores reais).

## Deferred from: code review de 1-2-autenticacao-e-middleware-de-protecao (2026-04-17)

- **Latência de BD por requisição em /admin** [`src/middleware.ts:51-60`] — Query ao `profiles` em todo request para `/admin`. Otimizável via JWT custom claims no Supabase para evitar round-trip ao banco.
- **E2E usa `npm run dev`** [`playwright.config.ts:8`] — Mais lento e menos fiel ao comportamento de produção. Substituir por `npm run build && npm run start` quando CI for configurado.
- **Sem feedback visual durante logout** [`src/components/shared/nav-user.tsx:21`] — Botão desabilitado sem spinner/indicador de loading. Baixa prioridade para MVP.
- **Mocks manuais de NextRequest/NextResponse frágeis** [`src/middleware.test.ts:5-35`] — Reconstrução manual pode divergir do runtime real. Considerar `@edge-runtime/jest-environment` ou similar.
- **Rotas de redirecionamento hardcoded** — `/auth/login`, `/dashboard` escritos em string em múltiplos arquivos. Centralizar em `src/lib/routes.ts` quando o volume de rotas crescer.
- **login-form e nav-user fora de `src/features/auth/`** [`src/components/`] — Ambiguidade de convenção: são componentes UI/shared mas dependem do domínio auth. Reorganizar junto com a estrutura de features.

## Deferred from: code review di-3-github-branch-protection (2026-04-20)

- **Sem script/IaC reproduzível para branch protection** — AC1–AC7 configurados via `gh api` sem artefato versionado. Se as regras forem resetadas, precisam ser reaplicadas manualmente. Considerar script de bootstrap em DI.4 ou future infra epic.
- **Check names CI/Vercel são placeholders** — `ci / build-and-test` e `Vercel – agenda-clubber` não foram validados contra os checks reais. Verificar nomes exatos quando DI.4 land e Vercel for conectado; atualizar via `gh api` se necessário.
- **Padrão inconsistente de erro em `src/features/auth/actions.ts:110`** — usa cast sem guards (`err as { code?: string }`), enquanto `artists/actions.ts` foi corrigido para type narrowing. Unificar quando auth for tocado novamente.
- **Storage cleanup sem tratamento de erro** [`src/features/artists/actions.ts:251`] — `supabase.storage.from("artist_media").remove()` pode falhar silenciosamente, deixando arquivos órfãos no storage.

## Deferred from: code review de 2-2-busca-global-de-talentos-e-cmd-k (2026-04-27)

- **`<img>` direto em vez de `next/image` (CLS, payload excessivo)** [`src/features/artists/components/artist-identity-card.tsx`, `src/features/collectives/components/collective-card.tsx`] — Uso de tag `<img>` nativa (com eslint-disable) burla otimização de imagens do Next.js causando CLS e payloads grandes. Migração para `<Image>` do next/image requer dimensões fixas ou `fill` mode e afeta múltiplos componentes. Deferir para quando o design de cards estiver estabilizado.

## Deferred from: code review de 2-1-criacao-de-perfil-on-the-fly-e-notificacao (2026-04-23)

- **Missing `created_by`/`collective_id` em artistas on-the-fly** — Registros criados sem vínculo auditável de quem os criou. Endereçar na story de claim (2.3) quando o link ao perfil do artista for estabelecido.
- **Email do convite não persistido no banco** — O email passado na action não é salvo; apenas enviado ao QStash. Sem persistência, não é possível auditar envios ou reenviar convites. Endereçar quando email real for integrado.
- **Ausência de CHECK constraint DB** — Sem constraint garantindo que `is_verified=true` implica `profile_id NOT NULL` e `genre_primary NOT NULL`. Risco de corrupção de estado. Candidato a migration de hardening no Épico 2 ou 3.
- **`NEXT_PUBLIC_SITE_URL` usado em módulo de backend** [`src/features/notifications/qstash.ts`] — Pattern preexistente no projeto; vaza para o bundle do browser. Criar variável privada `SITE_URL` quando o projeto tiver contexto de múltiplos ambientes.
- **Webhook sem idempotência** [`src/app/api/webhooks/notifications/artist-claim/route.ts`] — QStash garante at-least-once; duplicatas causarão emails duplicados quando integração real for feita. Adicionar dedup por `Upstash-Message-Id` na story de integração transacional.
- **Rate limiting ausente em `createOnTheFlyArtistAction`** — Admin com token comprometido pode fazer flood de inserts + chamadas QStash. Endereçar com middleware de rate limiting (Vercel Edge / Upstash Ratelimit) em epic de segurança.
- **`err.code === "23505"` sem tipagem** [`src/features/artists/actions.ts`] — Pattern frágil preexistente em `saveArtistOnboardingAction` também. Unificar com helper tipado quando Drizzle for atualizado.
- **Signing keys QStash ausentes em produção** — `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` ausentes causam rejeição de todos os webhooks. Documentado no `.env.example`; adicionar validação de startup em produção.

## Deferred from: Story 2.3 — Busca Obrigatória, Claim e Gestão de Privacidade (2026-04-24)

- **UI granular por campo de privacy** [`src/features/artists/components/privacy-settings-fieldset.tsx`] — O MVP deriva todos os `fields` automaticamente do `mode` selecionado. Controle individual por campo (social_links, presskit, bio, genre) fica deferido para uma iteração de produto futura.
- **enum `profiles.role` sem 'admin'** [`src/db/schema/auth.ts`] — O role 'admin' não está no enum Drizzle/Postgres (`['artista', 'produtor']`). O helper `isPlatformAdmin` usa `@ts-expect-error` temporariamente. Adicionar 'admin' ao enum + migration na Story 5.1 quando o dashboard administrativo for implementado.
- **Notificação QStash ao admin de novo `pending_approval`** [`src/features/notifications/qstash.ts`] — Reutilizar QStash existente para notificar admins quando um artista faz claim/onboarding com status='pending_approval'. Deferido pois exige novo webhook handler. Avaliar na Story 5.1.
- **`supabase db reset` não validado no worktree** — Migration 005 criada mas Supabase local não estava rodando no worktree. Validar `supabase db reset` no ambiente de dev antes do merge para garantir que a migration aplica sem erros.

## Deferred from: code review de 2-4-perfil-publico-adaptativo-e-seo (2026-04-28)

- **PLAYWRIGHT_BASE_URL não documentada para CI** [`e2e/global-setup.ts`] — Variável usada para setar cookies de sessão; se omitida em CI com porta randomizada, sessões autenticadas quebram. Adicionar ao README de E2E ou `.env.example`.
- **Cobertura E2E para status 'rejected'** — Artistas com `status='rejected'` bloqueiam rota mas não têm teste E2E dedicado. Adicionar seed + spec na camada de QA do Epic 5.
- **Artistas órfãos (profileId=null) em ghost mode ficam 404 até claim** [`src/features/artists/visibility.ts`] — Comportamento intencional: perfis importados sem claim em ghost mode são inacessíveis via UI. Documentado como decisão de produto; revisar após Story 2.5/2.6 (claim flow).
- **Validação runtime de privacySettings jsonb** [`src/features/artists/visibility.ts`] — `canSeeField` confia que o JSONB possui a estrutura esperada; dados corrompidos retornam `false` silenciosamente. Adicionar Zod parsing no boundary de `getPublicArtistBySlug` num ciclo de hardening.
- **Race condition de sessão entre generateMetadata e page** [`src/app/artists/[slug]/page.tsx`] — Token pode expirar nos microssegundos entre as duas execuções no servidor. Mitigado pelo React.cache() que garante uma única query por request; residual teórico sem impacto prático.
- **Owner/Admin preview de pending e ghost bloqueado pelo pre-check em page.tsx** [`src/app/artists/[slug]/page.tsx`] — Com `cacheComponents:true`, `notFound()` dentro de `<Suspense>` não altera o status HTTP (200 em vez de 404). Solução: pre-checks fora de Suspense usando `"use cache"` (queries.ts). Efeito colateral: `status !== 'approved'` e `mode === 'ghost'` são 404 para TODOS hoje (owner/admin preview sempre deferido para Story 5.x/5.1). Quando essas stories chegarem, opções: (a) mover checks para dentro de Suspense aceitando soft-404 para owner/admin; (b) ISR via `generateStaticParams`; (c) `"use cache"` chaveada por sessionId.

## Deferred from: code review de 2-3-busca-obrigatoria-claim-e-gestao-de-privacidade (2026-04-25)

- **ESCAPE ausente em `searchTalents` wildcard pattern** [`src/features/search/actions.ts:41`] — Pattern `%${query}%` não escapa `_` e `%` na query do usuário. Pré-existente da Story 2.2. Endereçar junto com hardening de busca.
- **`Promise.all` falha parcial em `searchRestrictedArtistByName`** [`src/features/artists/actions.ts:339`] — Se uma das duas queries paralelas falhar, ambas retornam DB_ERROR. Comportamento aceitável para MVP mas pode ser melhorado com tratamento individual de erro.
- **Mensagem de erro confusa para JSON inválido em privacySettings** [`src/features/artists/schemas.ts:13`] — Se JSON.parse falha no preprocess, Zod retorna "Expected object, received string" em vez de mensagem de validação clara. Melhoria de UX futura.
- **Ausência de CHECK constraint JSONB em `privacy_settings`** [`supabase/migrations/005_artists_claim_privacy.sql:6`] — Coluna aceita qualquer JSON sem constraint de estrutura mínima. Candidato a migration de hardening junto com o item da Story 2.1.
- **Mocks de testes com ordenação frágil** [`src/features/artists/actions.test.ts:400`] — `mockResolvedValueOnce` acoplado a ordem de chamadas internas. Refatorar para mocks mais declarativos quando os testes forem tocados novamente.
- **Perda de estado do onboarding ao recarregar página** [`src/app/(dashboard)/onboarding/artist/page.tsx:12`] — Estado do step (`search`/`claim`/`create`) é em memória; F5 reseta para `search` e dados do form de claim são perdidos. Persistir em `sessionStorage` ou URL params em iteração futura.
- **`getArtistStatus` no dashboard sem gate de role** [`src/app/(dashboard)/dashboard/artist/page.tsx:7`] — Página não verifica se usuário logado tem role `artista`. Produtor que navegar diretamente para `/dashboard/artist` verá tela vazia mas sem erro. Endereçar quando routing por role for implementado.
- **`isPlatformAdmin` retorna `false` se role é null no banco** [`src/features/auth/helpers.ts:20`] — Fallback conservador correto, mas admins com registro corrompido perdem visibilidade de pending_approval silenciosamente. Adicionar log de warning.
