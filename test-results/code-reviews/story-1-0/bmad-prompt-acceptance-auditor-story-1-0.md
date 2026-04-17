# Acceptance Auditor Review Prompt — Story 1.0

> **Como usar:** Copie TUDO abaixo da linha `---PROMPT---` e cole em uma nova conversa do Gemini (ou outro modelo).
>
> Recomendado: **anexar também** os documentos de contexto abaixo:
> - `_bmad-output/planning-artifacts/prd.md`
> - `_bmad-output/planning-artifacts/architecture.md`
> - `_bmad-output/planning-artifacts/epics.md`
>
> Depois cole a resposta (lista Markdown) de volta na conversa do Claude Code.

---PROMPT---

Você é um **Acceptance Auditor**. Sua tarefa é revisar o diff abaixo **exclusivamente contra a especificação da Story 1.0** (e, quando disponíveis, os documentos de contexto — PRD, Architecture, Epics). Você não está avaliando qualidade de código nem caça-bugs: você está verificando **conformidade com a especificação**.

## O QUE PROCURAR

1. **Violações de Critérios de Aceite (AC)** — AC não atendido ou parcialmente atendido.
2. **Desvios da intenção da especificação** — o código implementa algo diferente do que o AC descreve, ainda que "funcional".
3. **Comportamentos especificados mas ausentes** — o AC pede algo que não aparece no diff.
4. **Contradições entre restrições da especificação e o código** — ex.: Dev Notes dizem que X deve ser feito com Y, mas o diff usa Z.
5. **Efeitos colaterais não declarados** — código que altera mais que o escopo da story.

## FORMATO DE SAÍDA

Lista Markdown. Para cada finding:

```
- **<Título curto>** — **AC/Restrição:** <referência, ex.: "AC 3" ou "Dev Notes: Patterns"> — **Evidência:** <citação curta do diff com `arquivo:hunk`> — **Desvio:** <descrição do que está errado ou ausente em relação ao spec>
```

Sem preâmbulo, sem resumo final. Apenas a lista. Responda em **Português do Brasil**.

Se o diff **atender integralmente** todos os ACs, responda apenas:
```
- ✅ Conformidade total com a spec da Story 1.0 — nenhum desvio encontrado.
```
(Mas audite com rigor antes de chegar a essa conclusão.)

## SPEC — STORY 1.0

```markdown
# Story 1.0: Inicialização do Projeto e Infraestrutura Base

Status: review

## Story

As a developer,
I want to initialize the project with the official Supabase starter and core libraries,
so that I have a solid, standardized foundation for all subsequent features.

## Acceptance Criteria

1. **Initialization:** Project scaffolded using `npx create-next-app -e with-supabase agenda-clubber` with Next.js 15+ and Supabase SSR.
2. **Database & ORM:** Drizzle ORM (v0.45.2) configured to connect to Supabase PostgreSQL with `drizzle-kit` for migrations.
3. **UI & Design Tokens:**
    - Tailwind CSS configured with `Geist Sans` and `Geist Mono` typography.
    - Custom colors implemented in `tailwind.config.ts` (Pure Black base, Neon Red `#FF0000`, Neon Green, Neon Yellow).
    - Shadcn UI initialized and basic theme set to Dark.
4. **Environment:** `.env.local` synchronized with Supabase project credentials (URL, Anon Key, Service Role Key).
5. **Quality & Testing:**
    - Vitest (v4.1.4) and Playwright (v1.59.1) initialized.
    - Sentry (lib/sentry.ts) stubbed for monitoring.
    - CI/CD scaffold with GitHub Actions for linting and testing.
6. **Architecture Compliance:** Project structure follows the feature-based organization defined in `architecture.md`.

## Tasks / Subtasks

- [x] **Project Setup (AC: 1, 4)**
  - [x] Run `npx create-next-app -e with-supabase agenda-clubber`
  - [x] Configure `.env.local` with Supabase credentials
- [x] **Database Layer (AC: 2)**
  - [x] Install `drizzle-orm`, `drizzle-kit`, `postgres`
  - [x] Configure `drizzle.config.ts` and `src/db/index.ts`
  - [x] Create initial `profiles` and `collectives` schemas (snake_case in DB, camelCase in code)
- [x] **UI & Styling (AC: 3)**
  - [x] Initialize Shadcn UI: `npx shadcn-ui@latest init`
  - [x] Configure `tailwind.config.ts` with Neon palette and Geist fonts
  - [x] Implement `src/app/globals.css` with 1px border defaults
- [x] **Testing & Observability (AC: 5)**
  - [x] Install and configure Vitest
  - [x] Install and configure Playwright with base E2E test
  - [x] Initialize Sentry using `@sentry/nextjs`
- [x] **Quality Guardrails (TEA Requirement)**
  - [x] Create `src/lib/test-utils/seeding.ts` stub for future Seeding APIs
  - [x] Setup base MSW (Mock Service Worker) for external API mocking (WhatsApp/Maps)

## Dev Notes

- **Architecture:** Follow the Feature-based organization: `src/features/{auth,artists,calendar}`. [Source: architecture.md#Complete-Project-Directory-Structure]
- **Naming:** Database tables must be **plural** and `snake_case`. Drizzle must map to `camelCase`. [Source: architecture.md#Naming-Patterns]
- **Security:** RLS must be enabled on all new tables. [Source: agenda-clubber-handoff.md#Quality-Gates]
- **Design:** Aesthetics "Line-over-Black" with 1px borders. [Source: epics.md#UX-Design-Requirements]
```

## CHECKLIST DE AUDITORIA (use para ser sistemático)

- [ ] AC 1 — Projeto scaffolded com Next.js 15+ e Supabase SSR? Evidência no diff?
- [ ] AC 2 — Drizzle ORM configurado? `drizzle.config.ts` e `src/db/index.ts` presentes? Versão 0.45.2 verificável? Schemas `profiles` e `collectives` criados?
- [ ] AC 3 — `tailwind.config.ts` com Neon Red `#FF0000`, Neon Green, Neon Yellow? `Geist Sans` E `Geist Mono` configurados? Dark theme habilitado? Shadcn UI inicializado?
- [ ] AC 4 — `.env.local` aparece no diff? (Esperado que NÃO apareça por ser gitignored — mas a ausência deve ser notada como impossível de auditar pelo diff.)
- [ ] AC 5 — Vitest configurado? Playwright configurado? `sentry.ts` stub presente? CI/CD com GitHub Actions presente? Versões (Vitest v4.1.4, Playwright v1.59.1) verificáveis pelo diff?
- [ ] AC 6 — Estrutura feature-based (`src/features/`) presente? Schemas em `src/db/schema/`? Alias `@/` configurado?
- [ ] Dev Notes: Design — `globals.css` tem **1px border defaults**? (Atenção: o diff adiciona `border-width: 0` globalmente — isso contradiz "1px border defaults".)
- [ ] Dev Notes: Naming — Tabelas em `snake_case` no DB, `camelCase` no código Drizzle?
- [ ] Dev Notes: Security — RLS habilitado em todas as novas tabelas? (Apenas `profiles` tem migration de RLS no diff — `collectives` tem RLS?)
- [ ] Dev Notes: Architecture — `src/features/` estrutura criada? Schemas corretos em `src/db/schema/`?
- [ ] Escopo — O diff contém apenas infraestrutura base (Story 1.0) ou vaza para stories posteriores (ex.: schema `artists`, `collective-members` que pertencem às Stories 1.3/1.4)?

## DIFF PARA REVISÃO

```diff
diff --git a/drizzle.config.ts b/drizzle.config.ts
index b7d1c88..c1a52a5 100644
--- a/drizzle.config.ts
+++ b/drizzle.config.ts
@@ -1,10 +1,10 @@
-import { defineConfig } from "drizzle-kit";
+import { defineConfig } from 'drizzle-kit';
 
 export default defineConfig({
-  schema: "./src/db/schema/*",
-  out: "./supabase/migrations",
-  dialect: "postgresql",
+  schema: './src/db/schema/*',
+  out: './supabase/migrations',
+  dialect: 'postgresql',
   dbCredentials: {
-    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
+    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
   },
 });
diff --git a/src/app/globals.css b/src/app/globals.css
index bb595aa..a87c436 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -40,60 +40,58 @@
     --sidebar-border: oklch(0.922 0 0);
     --sidebar-ring: oklch(0.708 0 0);
   }
+
+  /* Line-over-Black: Pure Black base with neon accents */
   .dark {
-    --background: oklch(0.145 0 0);
+    --background: 0 0% 0%;
-    --foreground: oklch(0.985 0 0);
+    --foreground: 0 0% 98%;
-    --primary: oklch(0.922 0 0);
+    --primary: 0 100% 50%;
-    --destructive: oklch(0.704 0.191 22.216);
+    --destructive: 0 100% 50%;
     --destructive-foreground: 0 0% 98%;
-    --border: oklch(1 0 0 / 10%);
+    --border: 0 0% 15%;
-    --ring: oklch(0.556 0 0);
+    --ring: 0 100% 50%;
   }
+
   * {
     @apply border-border outline-ring/50;
+    border-width: 0;
   }
+
   body {
     @apply bg-background text-foreground;
   }
-}
-
-@layer base {
-  * {
-    @apply border-border;
-  }
-  body {
-    @apply bg-background text-foreground;
-  }
 }
\ No newline at end of file
diff --git a/src/app/layout.tsx b/src/app/layout.tsx
index 4d3424a..afc3903 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,5 +1,5 @@
 import type { Metadata } from "next";
-import { Geist } from "next/font/google";
+import { Geist, Geist_Mono } from "next/font/google";
 import { ThemeProvider } from "next-themes";
 import "./globals.css";
 
@@ -9,8 +9,8 @@
 export const metadata: Metadata = {
   metadataBase: new URL(defaultUrl),
-  title: "Next.js and Supabase Starter Kit",
+  title: "Agenda Clubber",
+  description: "Calendário colaborativo para a cena eletrônica de Fortaleza",
 };
 
+const geistMono = Geist_Mono({
+  variable: "--font-geist-mono",
+  display: "swap",
+  subsets: ["latin"],
+});
+
 export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   return (
-    <html lang="en" suppressHydrationWarning>
-      <body className={`${geistSans.className} antialiased`}>
+    <html lang="pt-BR" suppressHydrationWarning>
+      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
         <ThemeProvider
           attribute="class"
-          defaultTheme="system"
+          defaultTheme="dark"
           enableSystem
           disableTransitionOnChange
         >
diff --git a/tailwind.config.ts b/tailwind.config.ts
index 03323d5..bbf98a3 100644
--- a/tailwind.config.ts
+++ b/tailwind.config.ts
@@ -11,6 +11,11 @@
   theme: {
     extend: {
       colors: {
+        neon: {
+          red: "#FF0000",
+          green: "#00FF00",
+          yellow: "#FFFF00",
+        },
         background: "hsl(var(--background))",
diff --git a/vitest.config.ts b/vitest.config.ts
new file mode 100644
--- /dev/null
+++ b/vitest.config.ts
@@ -0,0 +1,16 @@
+import { defineConfig } from 'vitest/config'
+import react from '@vitejs/plugin-react'
+import path from 'path'
+
+export default defineConfig({
+    plugins: [react()],
+    test: {
+        environment: 'jsdom',
+        exclude: ['node_modules', 'e2e', '.next'],
+    },
+    resolve: {
+        alias: {
+            '@': path.resolve(__dirname, './src')
+        }
+    }
+})
diff --git a/playwright.config.ts b/playwright.config.ts
new file mode 100644
--- /dev/null
+++ b/playwright.config.ts
@@ -0,0 +1,17 @@
+import { defineConfig, devices } from '@playwright/test';
+
+export default defineConfig({
+    testDir: './e2e',
+    fullyParallel: true,
+    reporter: 'html',
+    use: {
+        baseURL: 'http://localhost:3000',
+        trace: 'on-first-retry',
+    },
+    projects: [
+        {
+            name: 'chromium',
+            use: { ...devices['Desktop Chrome'] },
+        },
+    ],
+});
diff --git a/src/db/index.ts b/src/db/index.ts
new file mode 100644
--- /dev/null
+++ b/src/db/index.ts
@@ -0,0 +1,18 @@
+import { drizzle } from 'drizzle-orm/postgres-js';
+import postgres from 'postgres';
+import * as auth from './schema/auth';
+import * as collectives from './schema/collectives';
+import * as collectiveMembers from './schema/collective-members';
+import * as artists from './schema/artists';
+
+if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
+    throw new Error('DATABASE_URL environment variable is required in production');
+}
+
+const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres';
+
+const globalForDb = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> };
+const client = globalForDb._pgClient ?? postgres(connectionString);
+if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;
+
+export const db = drizzle(client, { schema: { ...auth, ...collectives, ...collectiveMembers, ...artists } });
diff --git a/src/db/schema/profiles.ts b/src/db/schema/profiles.ts
new file mode 100644
--- /dev/null
+++ b/src/db/schema/profiles.ts
@@ -0,0 +1,2 @@
+// Re-export profiles from auth schema for backward compatibility
+export { profiles } from './auth';
diff --git a/src/db/schema/collectives.ts b/src/db/schema/collectives.ts
new file mode 100644
--- /dev/null
+++ b/src/db/schema/collectives.ts
@@ -0,0 +1,17 @@
+import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
+import { profiles } from './auth';
+
+export const collectives = pgTable('collectives', {
+    id: uuid('id').defaultRandom().primaryKey(),
+    name: text('name').notNull(),
+    location: text('location').notNull(),
+    logoUrl: text('logo_url'),
+    description: text('description'),
+    genrePrimary: text('genre_primary').notNull(),
+    genreSecondary: text('genre_secondary'),
+    socialLinks: jsonb('social_links'),
+    status: text('status').default('pending').notNull(),
+    ownerId: uuid('owner_id').references(() => profiles.id).notNull(),
+    createdAt: timestamp('created_at').defaultNow().notNull(),
+    updatedAt: timestamp('updated_at').defaultNow().notNull(),
+});
diff --git a/src/db/schema/schema.test.ts b/src/db/schema/schema.test.ts
new file mode 100644
--- /dev/null
+++ b/src/db/schema/schema.test.ts
@@ -0,0 +1,44 @@
+import { describe, it, expect } from 'vitest';
+import { profiles } from './auth';
+import { collectives } from './collectives';
+import { collectiveMembers } from './collective-members';
+import { artists } from './artists';
+
+describe('Database Schema', () => {
+    it('profiles table should have correct columns', () => {
+        expect(profiles.id).toBeDefined();
+        expect(profiles.userId).toBeDefined();
+        expect(profiles.nickname).toBeDefined();
+        expect(profiles.role).toBeDefined();
+        expect(profiles.createdAt).toBeDefined();
+        expect(profiles.updatedAt).toBeDefined();
+    });
+
+    it('collectives table should have correct columns', () => {
+        expect(collectives.id).toBeDefined();
+        expect(collectives.name).toBeDefined();
+        expect(collectives.location).toBeDefined();
+        expect(collectives.logoUrl).toBeDefined();
+        expect(collectives.genrePrimary).toBeDefined();
+        expect(collectives.status).toBeDefined();
+        expect(collectives.ownerId).toBeDefined();
+        expect(collectives.createdAt).toBeDefined();
+    });
+
+    it('collectiveMembers table should have correct columns', () => {
+        expect(collectiveMembers.id).toBeDefined();
+        expect(collectiveMembers.collectiveId).toBeDefined();
+        expect(collectiveMembers.profileId).toBeDefined();
+        expect(collectiveMembers.role).toBeDefined();
+    });
+
+    it('artists table should have correct columns', () => {
+        expect(artists.id).toBeDefined();
+        expect(artists.profileId).toBeDefined();
+        expect(artists.artisticName).toBeDefined();
+        expect(artists.location).toBeDefined();
+        expect(artists.genrePrimary).toBeDefined();
+        expect(artists.photoUrl).toBeDefined();
+        expect(artists.isVerified).toBeDefined();
+    });
+});
diff --git a/src/lib/sentry.ts b/src/lib/sentry.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/sentry.ts
@@ -0,0 +1,6 @@
+export const initSentry = () => {
+    if (process.env.NODE_ENV === 'production') {
+        // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
+        console.log('Sentry initialized (stub)');
+    }
+};
diff --git a/src/lib/sentry.test.ts b/src/lib/sentry.test.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/sentry.test.ts
@@ -0,0 +1,12 @@
+import { describe, it, expect } from 'vitest';
+import { initSentry } from './sentry';
+
+describe('Sentry', () => {
+    it('initSentry is a function', () => {
+        expect(typeof initSentry).toBe('function');
+    });
+
+    it('initSentry does not throw', () => {
+        expect(() => initSentry()).not.toThrow();
+    });
+});
diff --git a/src/lib/test-utils/seeding.ts b/src/lib/test-utils/seeding.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/test-utils/seeding.ts
@@ -0,0 +1,4 @@
+export const seedDatabase = async () => {
+    // Stub for future Seeding APIs
+    console.log('Seeding database (stub)');
+};
diff --git a/src/lib/test-utils/msw.ts b/src/lib/test-utils/msw.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/test-utils/msw.ts
@@ -0,0 +1,13 @@
+import { setupServer } from 'msw/node';
+import { http, HttpResponse } from 'msw';
+
+export const handlers = [
+  http.get('https://maps.googleapis.com/*', () => {
+    return HttpResponse.json({ status: 'OK' });
+  }),
+  http.post('https://graph.facebook.com/v19.0/*/messages', () => {
+    return HttpResponse.json({ message_id: 'mock-id' });
+  }),
+];
+
+export const server = setupServer(...handlers);
diff --git a/e2e/home.spec.ts b/e2e/home.spec.ts
new file mode 100644
--- /dev/null
+++ b/e2e/home.spec.ts
@@ -0,0 +1,6 @@
+import { test, expect } from '@playwright/test';
+
+test('has title', async ({ page }) => {
+  await page.goto('/');
+  await expect(page).toHaveTitle(/Next.js|Agenda Clubber/i);
+});
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,20 @@
+name: CI
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+jobs:
+  lint-and-test:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npm run lint
+      - run: npx vitest run
```

Agora produza a auditoria. **Somente a lista Markdown**, nada mais.
