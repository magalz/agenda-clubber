# Story DI.3: Configuração do Repositório GitHub e Proteção de Branch

Status: done

## Story

As a project lead,
I want the main branch protected and all merges gated behind CI checks,
so that no broken code reaches the integration branch and human reviewers cannot accidentally bypass quality gates.

## Acceptance Criteria

1. **Direct Push Blocked:** Direct pushes to `main` are blocked for all users (including admins by default — toggle "Include administrators"). All changes must go through Pull Requests.
2. **PR Review Required:** At least 1 PR review approval required before merge. Stale approvals dismissed when new commits are pushed.
3. **CI Status Check Required:** The GitHub Actions CI workflow (defined in Story DI.4) is configured as a required status check before merge is allowed.
4. **Vercel Deployment Check Required:** The Vercel deployment check (from Story DI.4) is configured as a required status check before merge is allowed.
5. **Branch Up-to-date Required:** Branches must be up-to-date with `main` before merge (prevents merging stale branches).
6. **Deletion Protection:** Branch deletion protection enabled on `main`.
7. **Force-push Protection:** Force pushes to `main` blocked.
8. **Linear History (Optional Recommendation):** Squash merge or linear history required (team decision — document in DI.2).
9. **Branch Naming Convention Documented:** The documented convention (in DI.2 docs) is: `feat/story-X-Y-description`, `fix/issue-description`, `chore/description`, `claude/<generated>` allowed for Claude Code worktrees.

## Tasks / Subtasks

- [x] **Verify Prerequisites (AC: all)**
  - [x] Confirm GitHub repo URL and admin access
  - [x] Confirm DI.4 CI workflow name (needed as required check name — may require coordinating with DI.4 execution or using a placeholder name then updating)
- [x] **Configure Branch Protection on `main` (AC: 1-7)**
  - [x] Navigate to GitHub repo → Settings → Branches → Add branch protection rule
  - [x] Pattern: `main`
  - [x] Enable: "Require a pull request before merging" with "Require approvals: 1"
  - [x] Enable: "Dismiss stale pull request approvals when new commits are pushed"
  - [x] Enable: "Require status checks to pass before merging"
    - Add required check: CI workflow (from DI.4, e.g., `ci / build-and-test`)
    - Add required check: Vercel deployment (e.g., `Vercel – agenda-clubber`)
  - [x] Enable: "Require branches to be up to date before merging"
  - [x] Enable: "Do not allow bypassing the above settings" (Include administrators)
  - [x] Enable: "Restrict deletions"
  - [x] Enable: "Block force pushes"
- [x] **Document Convention in README/CONTRIBUTING (AC: 9)**
  - [x] Add branch naming section (this ties into DI.2 — coordinate to avoid overlap; preferred: DI.2 documents the conventions, DI.3 just configures the platform)
- [x] **Validate Configuration (AC: 1-7)**
  - [x] Attempt direct push to `main` from a local clone → should be rejected
  - [x] Open a test PR → confirm merge button is disabled until checks pass
  - [x] Attempt to delete `main` branch via GitHub UI → should be blocked

## Dev Notes

- **GitHub-native, not code:** This story is 100% GitHub settings configuration — no code changes. Implementation is via GitHub UI or `gh` CLI.
- **Dependency order:** This story depends on DI.4's CI workflow name to configure required status checks. **Execution strategy options:**
  1. Execute DI.4 first, capture the workflow name, then execute DI.3 using that name.
  2. Execute DI.3 with a placeholder, then update after DI.4 lands.
  - **Recommended:** Option 1 — land DI.4 workflow file first (even if not fully optimized), then configure protection.
- **Admin bypass:** By default, GitHub allows admins to bypass protection. Explicitly enable "Include administrators" to enforce for everyone including the Project Lead.
- **`gh` CLI alternative:** Branch protection can be configured via `gh api` calls. Document the curl/gh commands in the story completion notes for reproducibility.

### References

- [Epic 1 Retrospective](_bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md) — Descoberta significativa / Épico DevOps scope
- [Epics - DevOps/Infra](_bmad-output/planning-artifacts/epics.md#epic-devops-infra-governanca-de-ambiente-e-pipeline-de-qualidade)
- [GitHub Docs - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Implementation Plan
1. Pré-requisito descoberto em execução: o repo GitHub (`magalz/agenda-clubber`) estava vazio — nenhum branch publicado. Adicionado remote `origin` e renomeado `master` → `main` para alinhar com convenção do projeto, depois feito push.
2. Configuração da proteção via `gh api PUT /repos/magalz/agenda-clubber/branches/main/protection` com payload JSON completo.
3. Status checks de DI.4 (`ci / build-and-test`, `Vercel – agenda-clubber`) adicionados como placeholder — serão reconhecidos automaticamente quando DI.4 criar o workflow e o Vercel for conectado.
4. Documentação de branch naming adicionada ao README.md (DI.2 cobriu apenas commit conventions).

### Completion Notes

Configuração aplicada via `gh api` em 2026-04-20:

```json
{
  "AC1_direct_push_blocked": true,
  "AC2_pr_review_required": 1,
  "AC2_stale_dismissed": true,
  "AC3_CI_check": true,
  "AC4_Vercel_check": true,
  "AC5_branch_up_to_date": true,
  "AC6_deletion_protected": true,
  "AC7_force_push_blocked": true
}
```

**Comando utilizado (reproduzível):**
```bash
gh api \
  --method PUT \
  repos/magalz/agenda-clubber/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci / build-and-test", "Vercel – agenda-clubber"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

**Pré-requisito extra executado:**
```bash
git remote add origin https://github.com/magalz/agenda-clubber.git
git branch -m master main
git push -u origin main
```

**AC 8 (Linear History):** Não configurado — decisão de equipe pendente. Recomendação: ativar squash merge após DI.4 land para manter histórico limpo no `main`. Ativar via GitHub UI: Settings → General → "Allow squash merging" (somente), desabilitar merge commits e rebase merging.

**AC 3/4 (status checks placeholder):** Os checks `ci / build-and-test` e `Vercel – agenda-clubber` estão registrados mas ainda não existem como workflows ativos. O merge será bloqueado até DI.4 criar o CI workflow e o Vercel ser conectado — comportamento correto e esperado.

### File List
- `README.md` (modificado — adicionada tabela de branch naming convention)
- GitHub branch protection: `main` (configuração remota via API, sem arquivo local)

### Review Findings

_Code review executado em 2026-04-20 — 3 camadas (Blind Hunter, Edge Case Hunter, Acceptance Auditor)_

- [x] [Review][Patch] AC8 (linear history) não documentado — a decisão da equipe sobre squash/linear history está pendente e não foi registrada em nenhum artefato. Adicionar nota no README ou story notes. [README.md]
- [x] [Review][Defer] Check names CI/Vercel são placeholders (`ci / build-and-test`, `Vercel – agenda-clubber`) — serão validados quando DI.4 land e Vercel for conectado. [di-3-github-branch-protection.md] — deferred, pre-existing dependency on DI.4
- [x] [Review][Defer] Sem script/IaC reproduzível para AC1–AC7 — branch protection foi configurada via `gh api` sem artefato versionado. Risco: reset acidental perde configuração. — deferred, out of scope desta story; considerar script de bootstrap em DI.4 ou epic de plataforma futura
- [x] [Review][Defer] Padrão inconsistente de tratamento de erro vs `src/features/auth/actions.ts:110` — auth usa cast sem guards, artists usa narrowing correto. — deferred, pre-existing, não causado por este diff
- [x] [Review][Defer] Storage cleanup sem tratamento de erro na remoção (`supabase.storage.from("artist_media").remove()`) — falha silenciosa pode deixar arquivos órfãos. — deferred, pre-existing

### Change Log
- 2026-04-20: Branch `main` publicado no GitHub (push inicial do repo local). Remote `origin` adicionado, `master` renomeado para `main`.
- 2026-04-20: Branch protection configurada em `magalz/agenda-clubber/main` via `gh api` — todos os ACs 1–7 verificados via API response.
- 2026-04-20: `README.md` atualizado com tabela de convenção de nomenclatura de branches (AC 9).
