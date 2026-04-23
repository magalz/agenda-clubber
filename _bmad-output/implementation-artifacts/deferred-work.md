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

## Deferred from: code review de 2-1-criacao-de-perfil-on-the-fly-e-notificacao (2026-04-23)

- **Missing `created_by`/`collective_id` em artistas on-the-fly** — Registros criados sem vínculo auditável de quem os criou. Endereçar na story de claim (2.3) quando o link ao perfil do artista for estabelecido.
- **Email do convite não persistido no banco** — O email passado na action não é salvo; apenas enviado ao QStash. Sem persistência, não é possível auditar envios ou reenviar convites. Endereçar quando email real for integrado.
- **Ausência de CHECK constraint DB** — Sem constraint garantindo que `is_verified=true` implica `profile_id NOT NULL` e `genre_primary NOT NULL`. Risco de corrupção de estado. Candidato a migration de hardening no Épico 2 ou 3.
- **`NEXT_PUBLIC_SITE_URL` usado em módulo de backend** [`src/features/notifications/qstash.ts`] — Pattern preexistente no projeto; vaza para o bundle do browser. Criar variável privada `SITE_URL` quando o projeto tiver contexto de múltiplos ambientes.
- **Webhook sem idempotência** [`src/app/api/webhooks/notifications/artist-claim/route.ts`] — QStash garante at-least-once; duplicatas causarão emails duplicados quando integração real for feita. Adicionar dedup por `Upstash-Message-Id` na story de integração transacional.
- **Rate limiting ausente em `createOnTheFlyArtistAction`** — Admin com token comprometido pode fazer flood de inserts + chamadas QStash. Endereçar com middleware de rate limiting (Vercel Edge / Upstash Ratelimit) em epic de segurança.
- **`err.code === "23505"` sem tipagem** [`src/features/artists/actions.ts`] — Pattern frágil preexistente em `saveArtistOnboardingAction` também. Unificar com helper tipado quando Drizzle for atualizado.
- **Signing keys QStash ausentes em produção** — `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` ausentes causam rejeição de todos os webhooks. Documentado no `.env.example`; adicionar validação de startup em produção.
