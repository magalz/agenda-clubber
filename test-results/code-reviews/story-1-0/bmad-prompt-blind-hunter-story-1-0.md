# Blind Hunter Review Prompt — Story 1.0

> **Como usar:** Copie TUDO abaixo da linha `---PROMPT---` e cole em uma nova conversa do Gemini (ou outro modelo). Não forneça nenhum contexto adicional do projeto. Depois cole a resposta (lista Markdown de findings) de volta na conversa do Claude Code.

---PROMPT---

Você é um **Blind Hunter**, um revisor de código cínico, cético e impaciente. O código a seguir foi submetido por alguém que você presume ser descuidado, e sua expectativa é encontrar problemas.

## REGRAS DE OPERAÇÃO

- Você NÃO tem nenhum contexto do projeto além do diff abaixo. NÃO assuma nada sobre arquivos, módulos, convenções ou histórico que não esteja no próprio diff.
- NÃO sugira correções. Apenas reporte findings.
- Encontre **no mínimo 10 problemas**. Se encontrar menos, re-analise — você está sendo complacente.
- Tom profissional e preciso. Sem palavrões. Sem ataques pessoais.
- Responda em **Português do Brasil**.

## O QUE PROCURAR

1. **Bugs e erros de lógica óbvios** — fluxos quebrados, condições invertidas, valores errados retornados.
2. **Falhas de segurança** — vazamento de dados, credenciais expostas, injeção, validação ausente em servidor, bypass de autenticação, políticas RLS fracas.
3. **Qualidade de código** — duplicação, complexidade desnecessária, nomes ruins, funções longas, tipos fracos (`any`, `unknown` sem refinar), logs esquecidos, código morto.
4. **Inconsistências internas ao próprio diff** — nomes que não batem entre arquivos, tipos divergentes, comentário que contradiz o código, padrão diferente entre funções próximas.
5. **Ausências suspeitas** — o que DEVERIA estar presente dado o próprio código (ex.: um campo obrigatório sem validação, estado sem loading/error, schema SQL sem índice óbvio, CI sem step crítico).

## FORMATO DE SAÍDA

Responda EXCLUSIVAMENTE como uma lista Markdown. Cada item:

```
- **<Título curto>** — <descrição do problema, com referência ao arquivo e, se possível, à linha do hunk>
```

Sem preâmbulo, sem epílogo, sem agrupamentos. Apenas a lista.

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
-    --foreground: oklch(0.985 0 0);
+    --background: 0 0% 0%;
+    --foreground: 0 0% 98%;
-    --card: oklch(0.205 0 0);
+    --card: 0 0% 4%;
-    --card-foreground: oklch(0.985 0 0);
+    --card-foreground: 0 0% 98%;
-    --popover: oklch(0.205 0 0);
+    --popover: 0 0% 4%;
-    --popover-foreground: oklch(0.985 0 0);
+    --popover-foreground: 0 0% 98%;
-    --primary: oklch(0.922 0 0);
+    --primary: 0 100% 50%;
-    --primary-foreground: oklch(0.205 0 0);
+    --primary-foreground: 0 0% 0%;
-    --secondary: oklch(0.269 0 0);
+    --secondary: 0 0% 10%;
-    --secondary-foreground: oklch(0.985 0 0);
+    --secondary-foreground: 0 0% 98%;
-    --muted: oklch(0.269 0 0);
+    --muted: 0 0% 10%;
-    --muted-foreground: oklch(0.708 0 0);
+    --muted-foreground: 0 0% 64%;
-    --accent: oklch(0.269 0 0);
+    --accent: 0 0% 10%;
-    --accent-foreground: oklch(0.985 0 0);
+    --accent-foreground: 0 0% 98%;
-    --destructive: oklch(0.704 0.191 22.216);
+    --destructive: 0 100% 50%;
     --destructive-foreground: 0 0% 98%;
-    --border: oklch(1 0 0 / 10%);
+    --border: 0 0% 15%;
-    --input: oklch(1 0 0 / 15%);
+    --input: 0 0% 15%;
-    --ring: oklch(0.556 0 0);
+    --ring: 0 100% 50%;
-    --chart-1: oklch(0.87 0 0);
+    --chart-1: 0 100% 50%;
-    --chart-2: oklch(0.556 0 0);
+    --chart-2: 120 100% 50%;
-    --chart-3: oklch(0.439 0 0);
+    --chart-3: 60 100% 50%;
-    --chart-4: oklch(0.371 0 0);
+    --chart-4: 0 0% 64%;
-    --chart-5: oklch(0.269 0 0);
+    --chart-5: 0 0% 40%;
-    --sidebar: oklch(0.205 0 0);
+    --sidebar: 0 0% 4%;
-    --sidebar-foreground: oklch(0.985 0 0);
+    --sidebar-foreground: 0 0% 98%;
-    --sidebar-primary: oklch(0.488 0.243 264.376);
+    --sidebar-primary: 0 100% 50%;
-    --sidebar-primary-foreground: oklch(0.985 0 0);
+    --sidebar-primary-foreground: 0 0% 0%;
-    --sidebar-accent: oklch(0.269 0 0);
+    --sidebar-accent: 0 0% 10%;
-    --sidebar-accent-foreground: oklch(0.985 0 0);
+    --sidebar-accent-foreground: 0 0% 98%;
-    --sidebar-border: oklch(1 0 0 / 10%);
+    --sidebar-border: 0 0% 15%;
-    --sidebar-ring: oklch(0.556 0 0);
+    --sidebar-ring: 0 100% 50%;
   }
+
   .theme {
     --font-heading: var(--font-sans);
     --font-sans: var(--font-sans);
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
+
   html {
     @apply font-sans;
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
 
@@ -9,8 +9,8 @@ const defaultUrl = process.env.VERCEL_URL
 
 export const metadata: Metadata = {
   metadataBase: new URL(defaultUrl),
-  title: "Next.js and Supabase Starter Kit",
-  description: "The fastest way to build apps with Next.js and Supabase",
+  title: "Agenda Clubber",
+  description: "Calendário colaborativo para a cena eletrônica de Fortaleza",
 };
 
 const geistSans = Geist({
@@ -19,17 +19,23 @@ const geistSans = Geist({
   subsets: ["latin"],
 });
 
+const geistMono = Geist_Mono({
+  variable: "--font-geist-mono",
+  display: "swap",
+  subsets: ["latin"],
+});
+
 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
 }>) {
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
@@ -11,6 +11,11 @@ export default {
   theme: {
     extend: {
       colors: {
+        neon: {
+          red: "#FF0000",
+          green: "#00FF00",
+          yellow: "#FFFF00",
+        },
         background: "hsl(var(--background))",
         foreground: "hsl(var(--foreground))",
diff --git a/vitest.config.ts b/vitest.config.ts
new file mode 100644
index 0000000..c852b9f
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
index 0000000..5422230
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
index 0000000..191dea8
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
index 0000000..24e8af8
--- /dev/null
+++ b/src/db/schema/profiles.ts
@@ -0,0 +1,2 @@
+// Re-export profiles from auth schema for backward compatibility
+export { profiles } from './auth';
diff --git a/src/db/schema/collectives.ts b/src/db/schema/collectives.ts
new file mode 100644
index 0000000..e33c325
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
index 0000000..d3b1fb0
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
index 0000000..f836672
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
index 0000000..73a364e
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
index 0000000..6ce8fad
--- /dev/null
+++ b/src/lib/test-utils/seeding.ts
@@ -0,0 +1,4 @@
+export const seedDatabase = async () => {
+    // Stub for future Seeding APIs
+    console.log('Seeding database (stub)');
+};
diff --git a/src/lib/test-utils/msw.ts b/src/lib/test-utils/msw.ts
new file mode 100644
index 0000000..847722c
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
index 0000000..4a64cc0
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
index 0000000..b3a2452
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

Agora produza os findings. Lembre: mínimo 10, lista Markdown, nada além da lista.
