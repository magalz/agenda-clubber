# Technical Stack: agenda-clubber

> **Status:** Finalized
> **Versão:** 1.0
> **Responsável:** Aria (Architect)
> **Stack Principal:** Next.js + Supabase + Tailwind CSS

## 1. Frontend Architecture
- **Framework:** Next.js 15 (App Router).
- **Styling:** Tailwind CSS v4 (Industrial Dark Theme).
- **Language:** TypeScript.
- **Testing:** Vitest + React Testing Library.
- **Validation:** Zod.

## 2. Backend & Infrastructure (BaaS)
- **Platform:** Supabase.
- **Database:** PostgreSQL (Região: `sa-east-1` - São Paulo).
- **Authentication:** Supabase Auth (Email/Password).
- **Security:** PostgreSQL Row Level Security (RLS).
- **Storage:** Supabase Storage (Public/Private buckets).
- **Realtime:** Supabase Realtime for calendar updates.

## 3. Deployment Pipeline
- **Hosting:** Vercel.
- **CI/CD:** GitHub Actions.
- **Quality Gates:** 
  - Linting (ESLint).
  - Type Checking (TSC).
  - Unit Testing (Vitest).
  - Code Review (CodeRabbit).

---
*AIOX Architecture Reference*
