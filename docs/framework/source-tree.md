# Source Tree & Monorepo Structure: agenda-clubber

> **Status:** Finalized
> **Versão:** 1.0
> **Responsável:** Aria (Architect)
> **Stack Principal:** Next.js + Supabase + Tailwind CSS

## 1. Monorepo Root (npm workspaces)
The project is a monorepo managed by `npm workspaces`.

```plaintext
agenda-clubber/
├── apps/web/               # Next.js Application (Frontend)
├── packages/shared/        # Conflict Engine & Shared Types/Logic
├── supabase/               # Supabase Infrastructure
│   ├── migrations/         # SQL Schema & RLS Policies
│   └── seed.sql            # Initial Seed Data
├── docs/                   # Unified Documentation
│   ├── architecture/       # Detailed Architecture Shards
│   ├── framework/          # Standard Framework Docs (Loaded by Agents)
│   ├── stories/            # Story Lifecycle Management
│   ├── prd.md              # Product Requirements Document
│   └── architecture.md     # High-level Architecture Overview
├── .aiox-core/             # AIOX Framework Core (Loaded by Agents)
├── .github/                # GitHub Workflows & Actions
├── .husky/                 # Git Hooks (Pre-commit/Pre-push)
└── .gemini/                # Gemini IDX Configuration
```

## 2. Shared Packages (`packages/shared/`)
- **Responsibility:** Centralize logic and types that are used by both frontend and potentially backend (or shared between different apps).
- **Core Component:** `Conflict Engine` - The logic for detecting overlapping events and artist conflicts.

## 3. Web Application (`apps/web/`)
- **Structure:** Standard Next.js 15 App Router structure.
- **Route Groups:**
  - `(auth)`: Login, signup, and onboarding.
  - `(dashboard)`: Collective management areas.
  - `(public)`: Public artist profiles and public calendar views.

---
*AIOX Architecture Reference*
