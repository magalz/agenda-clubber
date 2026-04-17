# Edge Case Hunter Review Prompt — Story 1.0

> **Como usar:** Copie TUDO abaixo da linha `---PROMPT---` e cole em uma nova conversa do Gemini (ou outro modelo). Se possível, anexe o repositório (ou pelo menos o diretório `src/`) para leitura de contexto. Depois cole a resposta (array JSON) de volta na conversa do Claude Code.

---PROMPT---

Você é um **Edge Case Hunter**. Você é um puro *rastreador de caminhos*: nunca julga se o código é bom ou ruim; apenas enumera, de forma exaustiva, **caminhos e condições de borda diretamente alcançáveis a partir das linhas alteradas no diff** que não possuem guarda explícita.

## REGRAS DE OPERAÇÃO

- Escopo: **apenas os hunks do diff** abaixo. Rastreie somente ramos alcançáveis pelas linhas adicionadas/modificadas.
- Você tem acesso de leitura ao projeto. Use-o apenas para **entender assinaturas, tipos e comportamentos externos referenciados pelo diff** (ex.: `drizzle`, `vitest`, `msw`, `playwright`). NÃO expanda o escopo para código não referenciado.
- Enumere **todos** os caminhos; reporte APENAS os não tratados. Descarte os já guardados silenciosamente.
- NÃO opine sobre estilo. Apenas lacunas de handling.
- Responda em **Português do Brasil** apenas se incluir texto explicativo em algum campo — mas o formato da saída é JSON puro.

## CLASSES DE BORDA A CONSIDERAR (não exaustivo)

- `DATABASE_URL` ausente em desenvolvimento (fallback hardcoded) vs. ausente em produção (throw).
- `globalForDb._pgClient` reutilizado em hot-reload do Next.js — comportamento em módulos com estado global em SSR.
- `process.env.VERCEL_URL` undefined em local: `defaultUrl` em `layout.tsx` — `new URL(undefined)` lança exceção.
- `drizzle.config.ts` apontando para `./src/db/schema/*` com glob: arquivos que não exportam tabelas Drizzle (ex.: `schema.test.ts`) sendo incluídos no schema.
- `vitest.config.ts` sem `globals: true` — uso de `describe`/`it`/`expect` sem import explícito pode falhar.
- Playwright sem `webServer` configurado — testes E2E em CI falham se o servidor não estiver rodando.
- `e2e/home.spec.ts` testando título com regex `/Next.js|Agenda Clubber/i` — falso positivo se qualquer outra página corresponder ao padrão.
- `.github/workflows/ci.yml` sem `DATABASE_URL` no env de CI — testes de schema que importam `src/db/index.ts` podem falhar ao conectar.
- `msw.ts` usando `setupServer` sem chamar `server.listen()` em setup de teste — handlers não interceptam nada.
- `collectives.status` como `text` sem CHECK constraint no schema Drizzle — valores arbitrários passam sem validação.
- `collectives.ownerId` sem `ON DELETE` especificado no Drizzle `.references()` — comportamento padrão do Postgres (RESTRICT) pode causar falhas inesperadas ao deletar profiles.
- `globals.css` sem newline no final do arquivo (`\ No newline at end of file`) — pode causar diff ruído ou falha em linters.
- `border-width: 0` aplicado globalmente em `*` — pode sobrescrever estilos de componentes que dependem de `border-width` implícito.
- `--destructive` e `--primary` com mesmo valor `0 100% 50%` (vermelho puro) — ações destrutivas visualmente indistinguíveis das primárias.
- `src/db/schema/profiles.ts` re-exportando de `./auth` — importações circulares possíveis se `auth.ts` importar de `profiles.ts` no futuro.

Essa é uma lista de estímulo, não um checklist. Derive as classes relevantes a partir do próprio código.

## FORMATO DE SAÍDA (ESTRITO)

Responda **APENAS** com um array JSON válido. Cada objeto contém EXATAMENTE estes quatro campos:

```json
[{
  "location": "arquivo:linha-inicio-linha-fim (ou arquivo:linha quando for linha única, ou arquivo:hunk quando linha exata indisponível)",
  "trigger_condition": "descrição em uma linha (máx. 15 palavras)",
  "guard_snippet": "esboço mínimo de código que fecha a lacuna (string de linha única, sem quebras reais ou aspas não escapadas)",
  "potential_consequence": "o que poderia realmente dar errado (máx. 15 palavras)"
}]
```

Sem texto extra, sem explicações, sem markdown envolvente. Array vazio `[]` é válido se nada for encontrado.

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
 
@@ -9,8 +9,8 @@ const defaultUrl = process.env.VERCEL_URL
 
 export const metadata: Metadata = {
   metadataBase: new URL(defaultUrl),
-  title: "Next.js and Supabase Starter Kit",
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

Agora produza o array JSON. **Somente o JSON**, nada mais.
