# Prompt: Edge Case Hunter — Story 1.2 Autenticação

Cole este prompt inteiro no Gemini.

---

You are a pure path tracer. Never comment on whether code is good or bad; only list **missing handling**.

Walk every branching path and boundary condition in the diff below. Report ONLY paths and conditions that lack handling — discard handled ones silently. Do NOT editorialize or add filler — findings only.

**Scope:** Only analyze the diff hunks. Ignore lines not present in the diff.

**Output:** Return ONLY a valid JSON array. Each object must have exactly these four fields:

```json
[{
  "location": "file:start-end (or file:line when single line)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```

No extra text, no markdown wrapping. An empty array `[]` is valid when no unhandled paths are found.

---

## PROJECT CONTEXT

This is a Next.js 15 app with:
- Supabase Auth (SSR) for authentication
- `@supabase/ssr` for session management via cookies
- Server Actions (React 19 `useActionState`) for form handling
- Zod for validation
- Middleware at `src/middleware.ts` for route protection
- `profiles` table in Supabase with a `role` column (`admin`, `artista`, `produtor`)
- Protected routes: `/dashboard/**`, `/admin/**`
- Auth routes: `/auth/**`, `/login`, `/sign-up`

---

## DIFF

```diff
diff --git a/src/components/login-form.tsx b/src/components/login-form.tsx
index 23040a0..3605e82 100644
--- a/src/components/login-form.tsx
+++ b/src/components/login-form.tsx
@@ -1,7 +1,7 @@
 "use client";
 
 import { cn } from "@/lib/utils";
-import { createClient } from "@/lib/supabase/client";
+import { signInAction, type SignInState } from "@/features/auth/actions";
 import { Button } from "@/components/ui/button";
 import {
   Card,
@@ -13,93 +13,87 @@ import {
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import Link from "next/link";
-import { useRouter } from "next/navigation";
-import { useState } from "react";
+import { useActionState } from "react";
+import { useFormStatus } from "react-dom";
+
+const initialState: SignInState = { data: null, error: null };
+
+function SubmitButton() {
+  const { pending } = useFormStatus();
+  return (
+    <Button type="submit" className="w-full" disabled={pending}>
+      {pending ? "Entrando..." : "Entrar"}
+    </Button>
+  );
+}
 
 export function LoginForm({
   className,
   ...props
 }: React.ComponentPropsWithoutRef<"div">) {
-  const [email, setEmail] = useState("");
-  const [password, setPassword] = useState("");
-  const [error, setError] = useState<string | null>(null);
-  const [isLoading, setIsLoading] = useState(false);
-  const router = useRouter();
-
-  const handleLogin = async (e: React.FormEvent) => {
-    e.preventDefault();
-    const supabase = createClient();
-    setIsLoading(true);
-    setError(null);
-
-    try {
-      const { error } = await supabase.auth.signInWithPassword({
-        email,
-        password,
-      });
-      if (error) throw error;
-      // Update this route to redirect to an authenticated route. The user already has an active session.
-      router.push("/protected");
-    } catch (error: unknown) {
-      setError(error instanceof Error ? error.message : "An error occurred");
-    } finally {
-      setIsLoading(false);
-    }
-  };
+  const [state, formAction] = useActionState(signInAction, initialState);
 
   return (
     <div className={cn("flex flex-col gap-6", className)} {...props}>
       <Card>
         <CardHeader>
-          <CardTitle className="text-2xl">Login</CardTitle>
+          <CardTitle className="text-2xl">Entrar</CardTitle>
           <CardDescription>
-            Enter your email below to login to your account
+            Digite seu email e senha para acessar sua conta
           </CardDescription>
         </CardHeader>
         <CardContent>
-          <form onSubmit={handleLogin}>
+          <form action={formAction}>
             <div className="flex flex-col gap-6">
               <div className="grid gap-2">
                 <Label htmlFor="email">Email</Label>
                 <Input
                   id="email"
+                  name="email"
                   type="email"
-                  placeholder="m@example.com"
+                  placeholder="email@exemplo.com"
                   required
-                  value={email}
-                  onChange={(e) => setEmail(e.target.value)}
                 />
+                {state.error?.fieldErrors?.email && (
+                  <p className="text-sm text-red-500">
+                    {state.error.fieldErrors.email[0]}
+                  </p>
+                )}
               </div>
               <div className="grid gap-2">
                 <div className="flex items-center">
-                  <Label htmlFor="password">Password</Label>
+                  <Label htmlFor="password">Senha</Label>
                   <Link
                     href="/auth/forgot-password"
                     className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                   >
-                    Forgot your password?
+                    Esqueceu a senha?
                   </Link>
                 </div>
                 <Input
                   id="password"
+                  name="password"
                   type="password"
                   required
-                  value={password}
-                  onChange={(e) => setPassword(e.target.value)}
                 />
+                {state.error?.fieldErrors?.password && (
+                  <p className="text-sm text-red-500">
+                    {state.error.fieldErrors.password[0]}
+                  </p>
+                )}
               </div>
-              {error && <p className="text-sm text-red-500">{error}</p>}
-              <Button type="submit" className="w-full" disabled={isLoading}>
-                {isLoading ? "Logging in..." : "Login"}
-              </Button>
+              {state.error && !state.error.fieldErrors && (
+                <p className="text-sm text-red-500">{state.error.message}</p>
+              )}
+              <SubmitButton />
             </div>
             <div className="mt-4 text-center text-sm">
-              Don&apos;t have an account?{" "}
+              Não tem uma conta?{" "}
               <Link
                 href="/auth/sign-up"
                 className="underline underline-offset-4"
               >
-                Sign up
+                Cadastre-se
               </Link>
             </div>
           </form>
diff --git a/tsconfig.json b/tsconfig.json
index 61d9b44..b14b633 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -20,7 +20,7 @@
       }
     ],
     "paths": {
-      "@/*": ["./*"]
+      "@/*": ["./src/*"]
     }
   },
   "include": [
--- /dev/null
+++ b/src/middleware.ts
@@ -0,0 +1,75 @@
+import { type NextRequest, NextResponse } from "next/server";
+import { createServerClient } from "@supabase/ssr";
+
+export async function middleware(request: NextRequest) {
+    let supabaseResponse = NextResponse.next({
+        request,
+    });
+
+    const supabase = createServerClient(
+        process.env.NEXT_PUBLIC_SUPABASE_URL!,
+        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
+        {
+            cookies: {
+                getAll() {
+                    return request.cookies.getAll();
+                },
+                setAll(cookiesToSet) {
+                    cookiesToSet.forEach(({ name, value }) =>
+                        request.cookies.set(name, value),
+                    );
+                    supabaseResponse = NextResponse.next({
+                        request,
+                    });
+                    cookiesToSet.forEach(({ name, value, options }) =>
+                        supabaseResponse.cookies.set(name, value, options),
+                    );
+                },
+            },
+        }
+    );
+
+    const { data: { user } } = await supabase.auth.getUser();
+
+    const isAuthRoute =
+        request.nextUrl.pathname.startsWith("/auth") ||
+        request.nextUrl.pathname === "/login" ||
+        request.nextUrl.pathname === "/sign-up";
+    const isProtectedRoute =
+        request.nextUrl.pathname.startsWith("/dashboard") ||
+        request.nextUrl.pathname.startsWith("/admin");
+
+    if (!user && isProtectedRoute) {
+        const url = request.nextUrl.clone();
+        url.pathname = "/auth/login";
+        return NextResponse.redirect(url);
+    }
+
+    if (user && isAuthRoute) {
+        const url = request.nextUrl.clone();
+        url.pathname = "/dashboard";
+        return NextResponse.redirect(url);
+    }
+
+    if (user && request.nextUrl.pathname.startsWith("/admin")) {
+        const { data: profile } = await supabase
+            .from("profiles")
+            .select("role")
+            .eq("user_id", user.id)
+            .single();
+
+        if (!profile || profile.role !== "admin") {
+            const url = request.nextUrl.clone();
+            url.pathname = "/dashboard";
+            return NextResponse.redirect(url);
+        }
+    }
+
+    return supabaseResponse;
+}
+
+export const config = {
+    matcher: [
+        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
+    ],
+};
--- /dev/null
+++ b/src/middleware.test.ts
@@ -0,0 +1,104 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+import { middleware, config } from "./middleware";
+import { NextResponse } from "next/server";
+
+vi.mock("next/server", () => {
+    return {
+        NextRequest: class {
+            nextUrl: { pathname: string; clone: () => URL };
+            cookies: { getAll: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
+            constructor(url: string) {
+                const parsedUrl = new URL(url);
+                this.nextUrl = {
+                    pathname: parsedUrl.pathname,
+                    clone: () => new URL(url),
+                };
+                this.cookies = {
+                    getAll: vi.fn().mockReturnValue([]),
+                    set: vi.fn(),
+                };
+            }
+        },
+        NextResponse: {
+            next: vi.fn().mockReturnValue({
+                cookies: { set: vi.fn() },
+            }),
+            redirect: vi.fn().mockImplementation((url) => ({
+                status: 307,
+                url: url.toString(),
+            })),
+        },
+    };
+});
+
+const mockGetUser = vi.fn();
+const mockSingle = vi.fn();
+const mockEq = vi.fn(() => ({ single: mockSingle }));
+const mockSelect = vi.fn(() => ({ eq: mockEq }));
+const mockFrom = vi.fn(() => ({ select: mockSelect }));
+
+vi.mock("@supabase/ssr", () => ({
+    createServerClient: vi.fn().mockReturnValue({
+        auth: { getUser: () => mockGetUser() },
+        from: () => mockFrom(),
+    }),
+}));
+
+describe("middleware", () => {
+    beforeEach(() => {
+        vi.clearAllMocks();
+        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
+    });
+
+    it("exports matchers correctly", () => {
+        expect(config.matcher).toBeDefined();
+        expect(Array.isArray(config.matcher)).toBe(true);
+    });
+
+    it("redirects unauthenticated users from /dashboard to /auth/login", async () => {
+        const { NextRequest } = await import("next/server");
+        const req = new NextRequest("http://localhost:3000/dashboard");
+        await middleware(req as never);
+        expect(NextResponse.redirect).toHaveBeenCalled();
+        const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as URL;
+        expect(redirectUrl.pathname).toBe("/auth/login");
+    });
+
+    it("redirects authenticated users from /auth/login to /dashboard", async () => {
+        mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
+        const { NextRequest } = await import("next/server");
+        const req = new NextRequest("http://localhost:3000/auth/login");
+        await middleware(req as never);
+        expect(NextResponse.redirect).toHaveBeenCalled();
+        const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as URL;
+        expect(redirectUrl.pathname).toBe("/dashboard");
+    });
+
+    it("allows unauthenticated access to public routes", async () => {
+        const { NextRequest } = await import("next/server");
+        const req = new NextRequest("http://localhost:3000/");
+        await middleware(req as never);
+        expect(NextResponse.next).toHaveBeenCalled();
+        expect(NextResponse.redirect).not.toHaveBeenCalled();
+    });
+
+    it("allows admin role access to /admin", async () => {
+        mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
+        mockSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
+        const { NextRequest } = await import("next/server");
+        const req = new NextRequest("http://localhost:3000/admin/users");
+        await middleware(req as never);
+        expect(NextResponse.next).toHaveBeenCalled();
+    });
+
+    it("blocks non-admin from /admin and redirects to /dashboard", async () => {
+        mockGetUser.mockResolvedValue({ data: { user: { id: "user-2" } }, error: null });
+        mockSingle.mockResolvedValue({ data: { role: "artista" }, error: null });
+        const { NextRequest } = await import("next/server");
+        const req = new NextRequest("http://localhost:3000/admin/users");
+        await middleware(req as never);
+        expect(NextResponse.redirect).toHaveBeenCalled();
+        const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as URL;
+        expect(redirectUrl.pathname).toBe("/dashboard");
+    });
+});
--- /dev/null
+++ b/src/features/auth/actions.ts
@@ -0,0 +1,65 @@
+"use server";
+
+import { z } from "zod";
+import { createClient } from "@/lib/supabase/server";
+import { redirect } from "next/navigation";
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
+        email: (formData.get("email") as string | null)?.trim().toLowerCase(),
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
--- /dev/null
+++ b/src/components/shared/nav-user.tsx
@@ -0,0 +1,31 @@
+"use client";
+
+import { useTransition } from "react";
+import { LogOut } from "lucide-react";
+import { Button } from "@/components/ui/button";
+import { signOutAction } from "@/features/auth/actions";
+
+export function NavUser() {
+    const [isPending, startTransition] = useTransition();
+
+    const handleLogout = () => {
+        startTransition(async () => {
+            await signOutAction();
+        });
+    };
+
+    return (
+        <div className="flex items-center gap-4">
+            <Button
+                variant="ghost"
+                size="sm"
+                onClick={handleLogout}
+                disabled={isPending}
+                className="text-muted-foreground hover:text-foreground"
+            >
+                <LogOut className="mr-2 h-4 w-4" />
+                Sair
+            </Button>
+        </div>
+    );
+}
--- /dev/null
+++ b/e2e/auth.spec.ts
@@ -0,0 +1,20 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Fluxos de Autenticação', () => {
+    test('redireciona não autenticado de /dashboard para /auth/login', async ({ page }) => {
+        await page.goto('/dashboard');
+        await expect(page).toHaveURL(/.*\/auth\/login/);
+    });
+
+    test('redireciona não autenticado de /admin para /auth/login', async ({ page }) => {
+        await page.goto('/admin');
+        await expect(page).toHaveURL(/.*\/auth\/login/);
+    });
+
+    test('página de login exibe campos obrigatórios', async ({ page }) => {
+        await page.goto('/auth/login');
+        await expect(page.locator('input[type="email"]')).toBeVisible();
+        await expect(page.locator('input[type="password"]')).toBeVisible();
+        await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
+    });
+});
--- /dev/null
+++ b/vitest.config.ts
@@ -0,0 +1,14 @@
+import { defineConfig } from 'vitest/config'
+import path from 'path'
+
+export default defineConfig({
+    test: {
+        environment: 'node',
+        exclude: ['node_modules', 'e2e', '.next'],
+    },
+    resolve: {
+        alias: {
+            '@': path.resolve(__dirname, './src')
+        }
+    }
+})
--- /dev/null
+++ b/playwright.config.ts
@@ -0,0 +1,22 @@
+import { defineConfig, devices } from '@playwright/test';
+
+export default defineConfig({
+    testDir: './e2e',
+    fullyParallel: true,
+    reporter: 'html',
+    webServer: {
+        command: 'npm run dev',
+        port: 3000,
+        reuseExistingServer: !process.env.CI,
+    },
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
```
