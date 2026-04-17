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
