# Acceptance Auditor Review Prompt — Story 1.1

> **Como usar:** Copie TUDO abaixo da linha `---PROMPT---` e cole em uma nova conversa do Gemini 3.1 Pro.
>
> Recomendado: **anexar também** os três documentos de contexto abaixo no upload do Gemini — eles dão base completa para a auditoria:
> - `_bmad-output/planning-artifacts/prd.md`
> - `_bmad-output/planning-artifacts/architecture.md`
> - `_bmad-output/planning-artifacts/epics.md`
>
> Depois cole a resposta (lista Markdown) de volta na conversa do Claude Code.

---PROMPT---

Você é um **Acceptance Auditor**. Sua tarefa é revisar o diff abaixo **exclusivamente contra a especificação da Story 1.1** (e, quando disponíveis, os documentos de contexto — PRD, Architecture, Epics). Você não está avaliando qualidade de código nem caça-bugs: você está verificando **conformidade com a especificação**.

## O QUE PROCURAR

1. **Violações de Critérios de Aceite (AC)** — AC não atendido ou parcialmente atendido.
2. **Desvios da intenção da especificação** — o código implementa algo diferente do que o AC descreve, ainda que "funcional".
3. **Comportamentos especificados mas ausentes** — o AC pede algo que não aparece no diff.
4. **Contradições entre restrições da especificação e o código** — ex.: Dev Notes dizem que X deve ser feito com Y, mas o diff usa Z.
5. **Efeitos colaterais não declarados** — código que altera mais que o escopo da story (ex.: criar também schemas não relacionados à 1.1).

## FORMATO DE SAÍDA

Lista Markdown. Para cada finding:

```
- **<Título curto>** — **AC/Restrição:** <referência, ex.: "AC 3" ou "Dev Notes: Patterns"> — **Evidência:** <citação curta do diff com `arquivo:linha/hunk`> — **Desvio:** <descrição do que está errado ou ausente em relação ao spec>
```

Sem preâmbulo, sem resumo final. Apenas a lista. Responda em **Português do Brasil**.

Se o diff **atender integralmente** todos os ACs, responda apenas:
```
- ✅ Conformidade total com a spec da Story 1.1 — nenhum desvio encontrado.
```
(Mas audite com rigor antes de chegar a essa conclusão.)

## SPEC — STORY 1.1

```markdown
# Story 1.1: Cadastro Inicial e Triagem de Papel

Status: review

## Story

As a new visitor,
I want to provide my basic credentials and choose my role,
so that I can be correctly routed through the system.

## Acceptance Criteria

1. **Sign-up Form:** A functional registration page capturing Email, Password, and Nickname ("nome que quer ser chamado").
2. **Auth Integration:** Successful creation of `auth.user` via Supabase Auth (SSR).
3. **Profile Persistence:** Automatic creation of a record in the `profiles` table using Drizzle ORM, linked to the `auth.user.id`.
4. **Role Selection:** Mandatory selection between "Sou Artista" and "Sou Produtor de Eventos".
5. **Routing Logic:**
    - If "Artista" is chosen, redirect to Artist Onboarding (Story 1.3).
    - If "Produtor" is chosen, redirect to Producer Onboarding (Story 1.4).
6. **Validation:** Client and server-side validation using Zod for all fields (Email format, Password strength, Nickname required).
7. **Security:** RLS policies on the `profiles` table must allow users to insert their own profile and read it.

## Tasks / Subtasks

- [x] **Database Schema (AC: 3)**
  - [x] Define `profiles` table in `src/db/schema/auth.ts` (id, user_id, nickname, role, created_at).
  - [x] Generate and run migrations: `npx drizzle-kit generate` & `npx drizzle-kit push`.
- [x] **UI Implementation (AC: 1, 4)**
  - [x] Create Sign-up page: `src/app/(auth)/sign-up/page.tsx`.
  - [x] Implement role selection radio group (Shadcn UI).
  - [x] Add "Termos de Uso e Confidencialidade" checkbox (FR1).
- [x] **Server Actions (AC: 2, 3, 5, 6)**
  - [x] Create `signUpAction` in `src/features/auth/actions.ts`.
  - [x] Implement Zod schema for sign-up validation.
  - [x] Integrate Supabase `auth.signUp`.
  - [x] Implement Drizzle insert for the `profiles` record.
  - [x] Handle redirect logic based on the selected role.
- [x] **Security (AC: 7)**
  - [x] Configure RLS for the `profiles` table in Supabase.
- [x] **Testing**
  - [x] Unit test for `signUpAction` validation logic.
  - [x] E2E test for the full sign-up and redirection flow.

## Dev Notes

- **Patterns:** Use the standard response format: `{ data: T | null, error: { message: string, code: string } | null }`. [Source: architecture.md#API-Response-Formats]
- **Naming:** Database columns in `snake_case`, code in `camelCase`. [Source: architecture.md#Naming-Patterns]
- **Auth:** Use Supabase SSR client. [Source: architecture.md#Auth-Method]

### Project Structure Notes

- Keep auth logic in `src/features/auth/`.
- UI components in `src/components/ui/` (Shadcn).

### References

- [PRD - FR1, FR5](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Data Architecture & Security](_bmad-output/planning-artifacts/architecture.md)
- [Epics - Story 1.1](_bmad-output/planning-artifacts/epics.md)
```

## CHECKLIST DE AUDITORIA (use para ser sistemático)

- [ ] AC 1 — Formulário captura Email, Password, Nickname? Está funcional?
- [ ] AC 2 — `supabase.auth.signUp` é chamado via SSR (server client)? Cria `auth.user`?
- [ ] AC 3 — Insert na tabela `profiles` via Drizzle? Linkado a `auth.user.id`? Se a criação da `auth.user` suceder e o insert falhar, o estado fica consistente?
- [ ] AC 4 — Seleção de papel é **obrigatória** (required no form + required no schema)? Opções exatas "Sou Artista" e "Sou Produtor de Eventos"?
- [ ] AC 5 — Redirect: `artista → /onboarding/artista`; `produtor → /onboarding/produtor`. As rotas batem com os nomes de arquivo das Stories 1.3/1.4?
- [ ] AC 6 — Validação Zod cobre formato de email, força de senha, nickname obrigatório? **Validação client E server**? (Atenção: no diff o cliente usa apenas `required` nativo do HTML, a validação Zod real ocorre só no servidor — isso atende "client-side validation"?)
- [ ] AC 7 — RLS permite INSERT e SELECT do próprio perfil? As policies referenciam `auth.uid()` corretamente?
- [ ] Dev Notes — Resposta segue o formato `{ data, error }`?
- [ ] Dev Notes — Colunas DB em `snake_case`, código em `camelCase`?
- [ ] Dev Notes — Auth usa Supabase SSR client?
- [ ] Project Structure — Lógica de auth em `src/features/auth/`? Componentes UI em `src/components/ui/`?
- [ ] Escopo — O diff contém apenas o necessário para 1.1 ou vaza para outras stories (ex.: `collectives`, `collective-members`, `artists`)?

## DIFF PARA REVISÃO

```diff
diff --git a/src/components/sign-up-form.tsx b/src/components/sign-up-form.tsx
index 6c4b369..f455f5b 100644
--- a/src/components/sign-up-form.tsx
+++ b/src/components/sign-up-form.tsx
@@ -1,7 +1,6 @@
 "use client";
 
 import { cn } from "@/lib/utils";
-import { createClient } from "@/lib/supabase/client";
 import { Button } from "@/components/ui/button";
 import {
   Card,
@@ -12,104 +11,137 @@ import {
 } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
+import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
+import { Checkbox } from "@/components/ui/checkbox";
 import Link from "next/link";
-import { useRouter } from "next/navigation";
-import { useState } from "react";
+import { useActionState } from "react";
+import { signUpAction, type SignUpState } from "@/features/auth/actions";
+
+const initialState: SignUpState = { data: null, error: null };
 
 export function SignUpForm({
   className,
   ...props
 }: React.ComponentPropsWithoutRef<"div">) {
-  const [email, setEmail] = useState("");
-  const [password, setPassword] = useState("");
-  const [repeatPassword, setRepeatPassword] = useState("");
-  const [error, setError] = useState<string | null>(null);
-  const [isLoading, setIsLoading] = useState(false);
-  const router = useRouter();
-
-  const handleSignUp = async (e: React.FormEvent) => {
-    e.preventDefault();
-    const supabase = createClient();
-    setIsLoading(true);
-    setError(null);
-
-    if (password !== repeatPassword) {
-      setError("Passwords do not match");
-      setIsLoading(false);
-      return;
-    }
-
-    try {
-      const { error } = await supabase.auth.signUp({
-        email,
-        password,
-        options: {
-          emailRedirectTo: `${window.location.origin}/protected`,
-        },
-      });
-      if (error) throw error;
-      router.push("/auth/sign-up-success");
-    } catch (error: unknown) {
-      setError(error instanceof Error ? error.message : "An error occurred");
-    } finally {
-      setIsLoading(false);
-    }
-  };
+  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
 
   return (
     <div className={cn("flex flex-col gap-6", className)} {...props}>
-      <Card>
+      <Card className="border border-border">
         <CardHeader>
-          <CardTitle className="text-2xl">Sign up</CardTitle>
-          <CardDescription>Create a new account</CardDescription>
+          <CardTitle className="text-2xl">Criar Conta</CardTitle>
+          <CardDescription>
+            Cadastre-se para acessar a Agenda Clubber
+          </CardDescription>
         </CardHeader>
         <CardContent>
-          <form onSubmit={handleSignUp}>
-            <div className="flex flex-col gap-6">
+          <form action={formAction}>
+            <div className="flex flex-col gap-5">
+              {/* Email */}
               <div className="grid gap-2">
                 <Label htmlFor="email">Email</Label>
                 <Input
                   id="email"
+                  name="email"
                   type="email"
-                  placeholder="m@example.com"
+                  placeholder="seu@email.com"
                   required
-                  value={email}
-                  onChange={(e) => setEmail(e.target.value)}
                 />
+                {state.error?.fieldErrors?.email && (
+                  <p className="text-sm text-neon-red">{state.error.fieldErrors.email[0]}</p>
+                )}
               </div>
+
+              {/* Nickname */}
               <div className="grid gap-2">
-                <div className="flex items-center">
-                  <Label htmlFor="password">Password</Label>
-                </div>
+                <Label htmlFor="nickname">Como quer ser chamado?</Label>
                 <Input
-                  id="password"
-                  type="password"
+                  id="nickname"
+                  name="nickname"
+                  type="text"
+                  placeholder="Seu apelido"
                   required
-                  value={password}
-                  onChange={(e) => setPassword(e.target.value)}
                 />
+                {state.error?.fieldErrors?.nickname && (
+                  <p className="text-sm text-neon-red">{state.error.fieldErrors.nickname[0]}</p>
+                )}
               </div>
+
+              {/* Password */}
               <div className="grid gap-2">
-                <div className="flex items-center">
-                  <Label htmlFor="repeat-password">Repeat Password</Label>
-                </div>
+                <Label htmlFor="password">Senha</Label>
                 <Input
-                  id="repeat-password"
+                  id="password"
+                  name="password"
                   type="password"
                   required
-                  value={repeatPassword}
-                  onChange={(e) => setRepeatPassword(e.target.value)}
                 />
+                <p className="text-xs text-muted-foreground">
+                  Mínimo 8 caracteres, 1 maiúscula e 1 número
+                </p>
+                {state.error?.fieldErrors?.password && (
+                  <p className="text-sm text-neon-red">{state.error.fieldErrors.password[0]}</p>
+                )}
+              </div>
+
+              {/* Role Selection */}
+              <div className="grid gap-3">
+                <Label>Qual é o seu papel?</Label>
+                <RadioGroup name="role" className="grid gap-3" required>
+                  <label
+                    htmlFor="role-artista"
+                    className="flex items-center gap-3 rounded-md border border-border p-4 cursor-pointer hover:border-neon-red transition-colors [&:has([data-state=checked])]:border-neon-red"
+                  >
+                    <RadioGroupItem value="artista" id="role-artista" />
+                    <div>
+                      <span className="font-medium">🎵 Sou Artista</span>
+                      <p className="text-xs text-muted-foreground">DJ, produtor musical, artista</p>
+                    </div>
+                  </label>
+                  <label
+                    htmlFor="role-produtor"
+                    className="flex items-center gap-3 rounded-md border border-border p-4 cursor-pointer hover:border-neon-red transition-colors [&:has([data-state=checked])]:border-neon-red"
+                  >
+                    <RadioGroupItem value="produtor" id="role-produtor" />
+                    <div>
+                      <span className="font-medium">🎪 Sou Produtor de Eventos</span>
+                      <p className="text-xs text-muted-foreground">Organizador, promoter, coletivo</p>
+                    </div>
+                  </label>
+                </RadioGroup>
+                {state.error?.fieldErrors?.role && (
+                  <p className="text-sm text-neon-red">{state.error.fieldErrors.role[0]}</p>
+                )}
+              </div>
+
+              {/* Terms */}
+              <div className="flex items-start gap-2">
+                <Checkbox id="terms" name="terms" />
+                <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
+                  Li e aceito os{" "}
+                  <Link href="/termos" className="underline text-neon-red hover:text-neon-red/80">
+                    Termos de Uso e Confidencialidade
+                  </Link>
+                </Label>
               </div>
-              {error && <p className="text-sm text-red-500">{error}</p>}
-              <Button type="submit" className="w-full" disabled={isLoading}>
-                {isLoading ? "Creating an account..." : "Sign up"}
+              {state.error?.fieldErrors?.terms && (
+                <p className="text-sm text-neon-red">{state.error.fieldErrors.terms[0]}</p>
+              )}
+
+              {/* General Error */}
+              {state.error && !state.error.fieldErrors && (
+                <p className="text-sm text-neon-red">{state.error.message}</p>
+              )}
+
+              <Button type="submit" className="w-full" disabled={isPending}>
+                {isPending ? "Criando conta..." : "Criar conta"}
               </Button>
             </div>
+
             <div className="mt-4 text-center text-sm">
-              Already have an account?{" "}
-              <Link href="/auth/login" className="underline underline-offset-4">
-                Login
+              Já tem uma conta?{" "}
+              <Link href="/auth/login" className="underline underline-offset-4 hover:text-neon-red">
+                Entrar
               </Link>
             </div>
           </form>
diff --git a/src/db/schema/auth.ts b/src/db/schema/auth.ts
new file mode 100644
index 0000000..2ad57bb
--- /dev/null
+++ b/src/db/schema/auth.ts
@@ -0,0 +1,10 @@
+import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
+
+export const profiles = pgTable('profiles', {
+    id: uuid('id').defaultRandom().primaryKey(),
+    userId: uuid('user_id').notNull().unique(),
+    nickname: text('nickname').notNull(),
+    role: text('role', { enum: ['artista', 'produtor'] }).notNull(),
+    createdAt: timestamp('created_at').defaultNow().notNull(),
+    updatedAt: timestamp('updated_at').defaultNow().notNull(),
+});
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
+    socialLinks: jsonb('social_links'), // For soundcloud, youtube, instagram
+    status: text('status').default('pending').notNull(), // pending, approved, rejected
+    ownerId: uuid('owner_id').references(() => profiles.id).notNull(), // Initial creator
+    createdAt: timestamp('created_at').defaultNow().notNull(),
+    updatedAt: timestamp('updated_at').defaultNow().notNull(),
+});
diff --git a/src/db/index.ts b/src/db/index.ts
new file mode 100644
index 0000000..58c1029
--- /dev/null
+++ b/src/db/index.ts
@@ -0,0 +1,11 @@
+import { drizzle } from 'drizzle-orm/postgres-js';
+import postgres from 'postgres';
+import * as auth from './schema/auth';
+import * as collectives from './schema/collectives';
+import * as collectiveMembers from './schema/collective-members';
+import * as artists from './schema/artists';
+
+const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres';
+
+const client = postgres(connectionString);
+export const db = drizzle(client, { schema: { ...auth, ...collectives, ...collectiveMembers, ...artists } });
diff --git a/src/features/auth/actions.ts b/src/features/auth/actions.ts
new file mode 100644
index 0000000..bec3788
--- /dev/null
+++ b/src/features/auth/actions.ts
@@ -0,0 +1,174 @@
+"use server";
+
+import { z } from "zod";
+import { createClient } from "@/lib/supabase/server";
+import { db } from "@/db/index";
+import { profiles } from "@/db/schema/auth";
+import { redirect } from "next/navigation";
+
+const signUpSchema = z.object({
+    email: z.string().email("Email inválido"),
+    password: z
+        .string()
+        .min(8, "A senha deve ter no mínimo 8 caracteres")
+        .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
+        .regex(/[0-9]/, "A senha deve conter ao menos um número"),
+    nickname: z
+        .string()
+        .min(2, "O apelido deve ter no mínimo 2 caracteres")
+        .max(50, "O apelido deve ter no máximo 50 caracteres"),
+    role: z.enum(["artista", "produtor"], {
+        errorMap: () => ({ message: "Selecione um papel" }),
+    }),
+    terms: z.literal(true, {
+        errorMap: () => ({ message: "Você deve aceitar os termos de uso" }),
+    }),
+});
+
+export type SignUpState = {
+    data: { userId: string } | null;
+    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
+};
+
+export async function signUpAction(
+    _prevState: SignUpState,
+    formData: FormData
+): Promise<SignUpState> {
+    const rawData = {
+        email: formData.get("email"),
+        password: formData.get("password"),
+        nickname: formData.get("nickname"),
+        role: formData.get("role"),
+        terms: formData.get("terms") === "on",
+    };
+
+    const parsed = signUpSchema.safeParse(rawData);
+
+    if (!parsed.success) {
+        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
+        return {
+            data: null,
+            error: {
+                message: "Dados inválidos. Corrija os campos abaixo.",
+                code: "VALIDATION_ERROR",
+                fieldErrors,
+            },
+        };
+    }
+
+    const { email, password, nickname, role } = parsed.data;
+
+    const supabase = await createClient();
+
+    const { data: authData, error: authError } = await supabase.auth.signUp({
+        email,
+        password,
+        options: {
+            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm`,
+        },
+    });
+
+    if (authError) {
+        return {
+            data: null,
+            error: {
+                message: authError.message,
+                code: "AUTH_ERROR",
+            },
+        };
+    }
+
+    if (!authData.user) {
+        return {
+            data: null,
+            error: {
+                message: "Erro ao criar usuário",
+                code: "AUTH_ERROR",
+            },
+        };
+    }
+
+    try {
+        await db.insert(profiles).values({
+            userId: authData.user.id,
+            nickname,
+            role,
+        });
+    } catch (err) {
+        return {
+            data: null,
+            error: {
+                message: "Erro ao criar perfil. Tente novamente.",
+                code: "PROFILE_ERROR",
+            },
+        };
+    }
+
+    if (role === "artista") {
+        redirect("/onboarding/artista");
+    } else {
+        redirect("/onboarding/produtor");
+    }
+}
+
+export const signInSchema = z.object({
+    email: z.string().email("Email inválido"),
+    password: z.string().min(1, "A senha é obrigatória"),
+});
+
+export type SignInState = {
+    data: { success: boolean } | null;
+    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
+};
+
+export async function signInAction(
+    _prevState: SignInState,
+    formData: FormData
+): Promise<SignInState> {
+    const rawData = {
+        email: formData.get("email"),
+        password: formData.get("password"),
+    };
+
+    const parsed = signInSchema.safeParse(rawData);
+
+    if (!parsed.success) {
+        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
+        return {
+            data: null,
+            error: {
+                message: "Dados inválidos. Corrija os campos abaixo.",
+                code: "VALIDATION_ERROR",
+                fieldErrors,
+            },
+        };
+    }
+
+    const { email, password } = parsed.data;
+    const supabase = await createClient();
+
+    const { error: authError } = await supabase.auth.signInWithPassword({
+        email,
+        password,
+    });
+
+    if (authError) {
+        return {
+            data: null,
+            error: {
+                message: "Credenciais inválidas.",
+                code: "AUTH_ERROR",
+            },
+        };
+    }
+
+    redirect("/dashboard");
+}
+
+export async function signOutAction() {
+    const supabase = await createClient();
+    await supabase.auth.signOut();
+    redirect("/");
+}
+
+export { signUpSchema };
diff --git a/src/features/auth/actions.test.ts b/src/features/auth/actions.test.ts
new file mode 100644
index 0000000..c2c9e41
--- /dev/null
+++ b/src/features/auth/actions.test.ts
@@ -0,0 +1,146 @@
+import { describe, it, expect } from "vitest";
+import { z } from "zod";
+
+// Re-define schema inline for unit testing (avoids server-only module issues)
+const signUpSchema = z.object({
+    email: z.string().email("Email inválido"),
+    password: z
+        .string()
+        .min(8, "A senha deve ter no mínimo 8 caracteres")
+        .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
+        .regex(/[0-9]/, "A senha deve conter ao menos um número"),
+    nickname: z
+        .string()
+        .min(2, "O apelido deve ter no mínimo 2 caracteres")
+        .max(50, "O apelido deve ter no máximo 50 caracteres"),
+    role: z.enum(["artista", "produtor"], {
+        errorMap: () => ({ message: "Selecione um papel" }),
+    }),
+    terms: z.literal(true, {
+        errorMap: () => ({ message: "Você deve aceitar os termos de uso" }),
+    }),
+});
+
+describe("signUpAction validation", () => {
+    it("accepts valid sign-up data", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(true);
+    });
+
+    it("rejects invalid email", () => {
+        const result = signUpSchema.safeParse({
+            email: "not-an-email",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+        if (!result.success) {
+            expect(result.error.flatten().fieldErrors.email).toBeDefined();
+        }
+    });
+
+    it("rejects weak password (too short)", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "Ab1",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+        if (!result.success) {
+            expect(result.error.flatten().fieldErrors.password).toBeDefined();
+        }
+    });
+
+    it("rejects password without uppercase", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "mypass123",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+    });
+
+    it("rejects password without number", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPassWord",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+    });
+
+    it("rejects empty nickname", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+        if (!result.success) {
+            expect(result.error.flatten().fieldErrors.nickname).toBeDefined();
+        }
+    });
+
+    it("rejects missing role", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "invalid",
+            terms: true,
+        });
+        expect(result.success).toBe(false);
+    });
+
+    it("rejects terms not accepted", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: false,
+        });
+        expect(result.success).toBe(false);
+        if (!result.success) {
+            expect(result.error.flatten().fieldErrors.terms).toBeDefined();
+        }
+    });
+
+    it("accepts role artista", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "artista",
+            terms: true,
+        });
+        expect(result.success).toBe(true);
+    });
+
+    it("accepts role produtor", () => {
+        const result = signUpSchema.safeParse({
+            email: "test@example.com",
+            password: "MyPass123",
+            nickname: "DJ Test",
+            role: "produtor",
+            terms: true,
+        });
+        expect(result.success).toBe(true);
+    });
+});
diff --git a/src/components/ui/radio-group.tsx b/src/components/ui/radio-group.tsx
new file mode 100644
index 0000000..3172cf3
--- /dev/null
+++ b/src/components/ui/radio-group.tsx
@@ -0,0 +1,38 @@
+"use client"
+
+import { Radio as RadioPrimitive } from "@base-ui/react/radio"
+import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
+
+import { cn } from "@/lib/utils"
+
+function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
+  return (
+    <RadioGroupPrimitive
+      data-slot="radio-group"
+      className={cn("grid w-full gap-2", className)}
+      {...props}
+    />
+  )
+}
+
+function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
+  return (
+    <RadioPrimitive.Root
+      data-slot="radio-group-item"
+      className={cn(
+        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
+        className
+      )}
+      {...props}
+    >
+      <RadioPrimitive.Indicator
+        data-slot="radio-group-indicator"
+        className="flex size-4 items-center justify-center"
+      >
+        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
+      </RadioPrimitive.Indicator>
+    </RadioPrimitive.Root>
+  )
+}
+
+export { RadioGroup, RadioGroupItem }
diff --git a/supabase/migrations/001_profiles_rls.sql b/supabase/migrations/001_profiles_rls.sql
new file mode 100644
index 0000000..53f2cd2
--- /dev/null
+++ b/supabase/migrations/001_profiles_rls.sql
@@ -0,0 +1,22 @@
+-- RLS Policies for profiles table
+-- Enable RLS
+ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
+
+-- Users can insert their own profile
+CREATE POLICY "Users can insert their own profile"
+ON profiles FOR INSERT
+TO authenticated
+WITH CHECK (user_id = auth.uid());
+
+-- Users can read their own profile
+CREATE POLICY "Users can read their own profile"
+ON profiles FOR SELECT
+TO authenticated
+USING (user_id = auth.uid());
+
+-- Users can update their own profile
+CREATE POLICY "Users can update their own profile"
+ON profiles FOR UPDATE
+TO authenticated
+USING (user_id = auth.uid())
+WITH CHECK (user_id = auth.uid());
```

Agora produza a auditoria. **Somente a lista Markdown**, nada mais.
