# Story DI.3: Configuração do Repositório GitHub e Proteção de Branch

Status: ready-for-dev

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

- [ ] **Verify Prerequisites (AC: all)**
  - [ ] Confirm GitHub repo URL and admin access
  - [ ] Confirm DI.4 CI workflow name (needed as required check name — may require coordinating with DI.4 execution or using a placeholder name then updating)
- [ ] **Configure Branch Protection on `main` (AC: 1-7)**
  - [ ] Navigate to GitHub repo → Settings → Branches → Add branch protection rule
  - [ ] Pattern: `main`
  - [ ] Enable: "Require a pull request before merging" with "Require approvals: 1"
  - [ ] Enable: "Dismiss stale pull request approvals when new commits are pushed"
  - [ ] Enable: "Require status checks to pass before merging"
    - Add required check: CI workflow (from DI.4, e.g., `ci / build-and-test`)
    - Add required check: Vercel deployment (e.g., `Vercel – agenda-clubber`)
  - [ ] Enable: "Require branches to be up to date before merging"
  - [ ] Enable: "Do not allow bypassing the above settings" (Include administrators)
  - [ ] Enable: "Restrict deletions"
  - [ ] Enable: "Block force pushes"
- [ ] **Document Convention in README/CONTRIBUTING (AC: 9)**
  - [ ] Add branch naming section (this ties into DI.2 — coordinate to avoid overlap; preferred: DI.2 documents the conventions, DI.3 just configures the platform)
- [ ] **Validate Configuration (AC: 1-7)**
  - [ ] Attempt direct push to `main` from a local clone → should be rejected
  - [ ] Open a test PR → confirm merge button is disabled until checks pass
  - [ ] Attempt to delete `main` branch via GitHub UI → should be blocked

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
_(to be filled by implementing agent)_

### Implementation Plan
_(to be filled by implementing agent)_

### Completion Notes
_(to be filled by implementing agent — include screenshots or `gh api` output of the final configuration)_

### File List
_(no code files — document GitHub settings changed)_

### Review Findings
_(to be filled by reviewer — verify via fresh test PR attempt)_

### Change Log
_(to be filled by implementing agent)_
