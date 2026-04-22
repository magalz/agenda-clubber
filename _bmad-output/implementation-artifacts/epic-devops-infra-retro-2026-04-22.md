# Retrospectiva — Épico DevOps/Infra: Governança de Ambiente e Pipeline de Qualidade

**Data:** 22 de abril de 2026
**Facilitador:** Amelia (Developer Agent)
**Project Lead:** Magal
**Time:** Amelia (Developer), Alice (Product Owner), Charlie (Senior Dev), Dana (QA), Elena (Junior Dev)

---

## Resumo do Épico

| Métrica | Valor |
|---------|-------|
| Stories concluídas | 5/5 (100%) |
| PRs mergeados | 4 (DI.3, DI.4, DI.5 + fix root redirect) |
| Patches de code review aplicados | 10+ (DI.2: 5, DI.3: 1, DI.5: 5) |
| Dívidas técnicas do Épico 1 resolvidas | 4/4 action items imediatos + 2 tech debts (#5, #6) |
| Itens adiados (Defer) | 11 |
| Decisão arquitetural pivotada | 1 (Supabase Branching → banco CI dedicado) |

**Stories entregues:**
- DI.1 — Limpeza de Dívida Técnica Imediata
- DI.2 — Documentação de Setup e `.env.example`
- DI.3 — Configuração do Repositório GitHub e Proteção de Branch
- DI.4 — Pipeline CI/CD com GitHub Actions e Vercel
- DI.5 — Supabase Branching e Workflow de Migrações

---

## Follow-through da Retro do Épico 1

| Action Item | Status | Evidência |
|-------------|--------|-----------|
| Criar `src/lib/routes.ts` | ✅ Done | Arquivo existe em `main` com `ROUTES` completo |
| Mover componentes auth para `features/auth/components/` | ✅ Done | `login-form.tsx` e `nav-user.tsx` movidos |
| Criar `.env.example` | ✅ Done | DI.2 — 6 seções, placeholders seguros |
| Corrigir status story 1.1 | ✅ Done | DI.1 |
| Criar e planejar Épico DevOps | ✅ Done | Este épico |
| Agreement: não iniciar Épico 2 antes do DevOps | ✅ Respeitado | Épico 2 em `backlog` |

**Follow-through: 100%.** O processo de retrospectiva tem dentes.

---

## O Que Foi Bem

1. **Fundação real entregue** — CI/CD pipeline verde, branch protection com gate de qualidade obrigatório, workflow de migrations documentado. O Épico 2 começa sobre base sólida.

2. **Adversarial review consistente** — Reviews de 3 camadas (Blind Hunter, Edge Case Hunter, Acceptance Auditor) aplicados em DI.2, DI.3 e DI.5. Surfacaram problemas reais antes de chegarem ao `main` (ex.: DATABASE_URL apontando para pooler em vez de direct URL, validate input no `migrate-prod.yml`).

3. **Follow-through 100% dos action items da retro anterior** — todos os 5 itens comprometidos no Épico 1 foram endereçados neste épico. Sem dívida carregada.

4. **Vercel operacional desde o início** — a integração Vercel estava funcionando antes mesmo do DI.4 ser mergeado (DI.3 já exigia o check como required status). Confirmado via status checks dos PRs.

5. **Decisão arquitetural pragmática no DI.5** — sem Supabase Pro, o time pivotou para banco CI dedicado sem travar. Decisão documentada no `CONTRIBUTING.md` com rationale claro.

---

## Desafios e Fricções

### 1. Story files desatualizados (DI.1 e DI.4)

**O que aconteceu:**
- DI.1: trabalho feito e mergeado, mas o story file ficou sem Dev Agent Record, tasks sem check e Change Log vazio.
- DI.4: tasks de Vercel marcadas como pendentes mesmo com Vercel já operacional.

**Root causes distintos:**
| Story | Root Cause |
|-------|-----------|
| DI.1 | Agente fechou o épico atualizando sprint-status mas não os story files individuais |
| DI.4 | Estado de sistema externo (Vercel) não estava documentado como pré-condição; ninguém fechou o loop após confirmação pós-merge |

**Impacto:** Qualquer sessão futura que leia esses artefatos tomaria decisões erradas sobre o estado real do projeto.

### 2. Worktree stale — sessão sem sync com `main`

**O que aconteceu:** Esta sessão de retrospectiva foi iniciada com um worktree que não estava sincronizado com o `main`. O sprint-status local mostrava DI.1, DI.4 e o épico inteiro como incompletos quando todos estavam `done` no `main`.

**Root cause:** Não havia regra explícita de sync obrigatório ao iniciar sessão. O worktree divergiu silenciosamente sem nenhum aviso.

**Impacto:** A retrospectiva quase foi conduzida com dados errados. Magal identificou o problema e solicitou sync antes de prosseguir.

### 3. DI.5 — título diverge da implementação

**O que aconteceu:** A story se chama "Supabase Branching e Workflow de Migrações" mas o que foi implementado é um banco CI dedicado (sem Supabase Branching). A decisão foi correta — Supabase Pro não estava disponível. Mas o título e parte da documentação ainda referenciam "Supabase Branching".

**Impacto:** Agentes futuros podem assumir que Supabase Branching está ativo quando não está.

---

## Descobertas Significativas

### Worktrees precisam de sync explícito ao início de sessão

A sincronização com o `main` não é opcional — é pré-requisito para qualquer leitura de estado de artefatos. Sem isso, decisões de processo são tomadas com dados defasados.

**Ação necessária:** Regra obrigatória no `CLAUDE.md` do projeto.

---

## Readiness Assessment

| Dimensão | Status |
|----------|--------|
| Stories completas | ✅ 5/5 done |
| CI/CD pipeline | ✅ Verde no `main` |
| Branch protection | ✅ Ativa, incluindo admins |
| Vercel (preview + produção) | ✅ Operacional (confirmado nos checks dos PRs) |
| Migrations CI/CD | ✅ Job `db-migrate` + workflow manual de produção |
| Story files (DI.1, DI.4, DI.5) | ⚠️ Artefatos desatualizados — fix antes do Épico 2 |
| Sync rule no CLAUDE.md | ⚠️ Ausente — fix antes do Épico 2 |

**Veredicto:** Épico DevOps entregou o que precisava entregar. Três fixes de artefato + uma regra de processo pendentes antes do Épico 2.

---

## Action Items

### Pré-Épico 2 (obrigatórios)

| # | Ação | Detalhe |
|---|------|---------|
| 1 | Adicionar regra de sync no `CLAUDE.md` | Qualquer sessão que acesse artefatos deve executar `git fetch origin main` e comparar sprint-status local com `origin/main` antes de qualquer leitura de estado |
| 2 | Corrigir artefato DI.5 | Atualizar título, descrição e notas para refletir "banco CI dedicado" em vez de "Supabase Branching" |
| 3 | Completar artefato DI.1 | Preencher Dev Agent Record com o que foi realmente implementado (routes.ts, mover auth components, fix status 1.1) |
| 4 | Completar artefato DI.4 | Marcar tasks de Vercel como done, confirmar o que foi entregue vs. o que estava planejado |

### Team Agreements (vigência imediata)

- **Checklist de fechamento de story:** Antes de marcar qualquer story como `done` no sprint-status, o agente deve verificar que o story file tem: tasks checadas, Dev Agent Record preenchido (modelo, plano, notas, file list, change log). Story file incompleto = story não está done.
- **Sync obrigatório ao início de sessão:** Toda sessão que acesse artefatos de projeto deve começar com `git fetch origin main` e verificar divergência do sprint-status.
- **Sistemas externos com estado:** Tasks que dependem de confirmação de sistemas externos (Vercel, Supabase, etc.) precisam ter um dono e um momento explícito de fechamento após confirmação.

---

## Preview do Épico 2

**Épico 2: Hub de Talentos e Soberania do Artista (Claim)**

Stories planejadas: 2.1, 2.2, 2.3, 2.4

**Dependências no Épico DevOps:**
- CI/CD pipeline verde (DI.4) — gate de qualidade em todos os PRs
- Branch protection ativa (DI.3) — merge bloqueado sem CI verde
- Migrations CI/CD (DI.5) — schema changes via CI, nunca em produção manual
- `routes.ts` com constantes tipadas (DI.1) — Épico 2 adiciona `/artists/:slug`
- `.env.example` e `CONTRIBUTING.md` (DI.2) — onboarding documentado

**Verificar antes de iniciar:**
- Story files DI.1, DI.4, DI.5 corrigidos ✅ (action items acima)
- Sync rule no CLAUDE.md adicionada ✅ (action item acima)
- `epic-devops-infra-retrospective` marcado como `done` no sprint-status

---

## Comprometimentos e Próximos Passos

1. **Executar os 4 action items pré-Épico 2** (artefatos + CLAUDE.md)
2. **Iniciar Épico 2** após confirmação dos fixes
3. **Aplicar checklist de fechamento de story** em todas as stories do Épico 2 em diante

---

*Retrospectiva realizada em 22 de abril de 2026. Segunda retrospectiva do projeto agenda-clubber.*
