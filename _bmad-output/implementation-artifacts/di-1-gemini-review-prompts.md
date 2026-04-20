---
story: DI.1
title: Prompts de Avaliação LLM — Limpeza de Dívida Técnica Imediata
date: 2026-04-19
target_model: gemini-2.5-pro
status: ready
---

# Prompts de Avaliação LLM — DI.1

Estes prompts são usados **após a implementação da DI.1** para avaliar a qualidade das mudanças via Gemini.

## Como usar

1. Abra o Gemini (gemini.google.com ou API com model `gemini-2.5-pro`)
2. **Sempre comece com o Prompt 0** — cole-o como primeira mensagem para estabelecer o contexto do projeto
3. Em seguida, cole o Prompt desejado (1, 2 ou 3) **em uma nova mensagem**
4. Substitua o placeholder `[COLE O DIFF AQUI]` pelo output de `git diff main...HEAD` (ou o trecho relevante)
5. Envie e analise o output

> **Dica:** Para uma revisão completa, rode os 3 prompts em sequência na mesma conversa após o Prompt 0.

---

## PROMPT 0 — Contexto do Projeto (incluir sempre primeiro)

```
Você é um revisor de código sênior especializado em Next.js e TypeScript.
Vou te apresentar mudanças de código de um projeto para revisão. Antes de qualquer análise, aqui está o contexto do projeto:

**Projeto:** agenda-clubber — plataforma web para artistas e coletivos musicais
**Stack:**
- Next.js 15 (App Router), React 19, TypeScript strict
- Supabase Auth com SSR (@supabase/ssr)
- Drizzle ORM + PostgreSQL
- Vitest 4 (unit/integration), Playwright (E2E)
- Tailwind CSS + shadcn/ui

**Convenções de código:**
- Estrutura feature-based: `src/features/<domínio>/components/`, `src/features/<domínio>/actions.ts`
- Alias de path: `@/` aponta para `src/` (ex: `@/features/auth/components/login-form`)
- Componentes reutilizáveis globais ficam em `src/components/`
- Utilitários em `src/lib/`
- Middleware de autenticação em `src/middleware.ts`
- Imports usam o alias `@/` — nunca paths relativos para cross-feature

**O que NÃO mudou nesta story:** nenhuma lógica de negócio, banco de dados, API ou UX — é refactoring puro.

Confirme com "Contexto recebido. Pode enviar as mudanças para análise." antes de eu continuar.
```

---

## PROMPT 1 — AC1: Módulo `src/lib/routes.ts`

```
Analise o arquivo `src/lib/routes.ts` implementado abaixo e avalie se ele atende ao Acceptance Criterion #1 da story DI.1.

**Acceptance Criterion #1:**
> `src/lib/routes.ts` existe e exporta constantes de rota tipadas para todas as rotas atuais:
> `/`, `/login`, `/signup`, `/onboarding/artist`, `/onboarding/producer`, `/dashboard`, `/admin`

**Código implementado:**
[COLE O CONTEÚDO DE src/lib/routes.ts AQUI]

**Avalie cada item abaixo e responda com uma tabela PASS / FAIL / WARN:**

| Item | Status | Justificativa |
|------|--------|---------------|
| Objeto `ROUTES` é exportado | | |
| Contém exatamente as 7 rotas: `/`, `/login`, `/signup`, `/onboarding/artist`, `/onboarding/producer`, `/dashboard`, `/admin` | | |
| Usa `as const` para imutabilidade e literal types | | |
| Exporta tipo `Route` derivado de `typeof ROUTES[keyof typeof ROUTES]` | | |
| Nenhuma rota está hardcoded como string literal fora deste arquivo no diff apresentado | | |
| O arquivo está em `src/lib/routes.ts` (não em outro local) | | |

**Após a tabela:** liste qualquer problema crítico (FAIL) com sugestão de correção. Se tudo passar, escreva "AC1: APROVADO".
```

---

## PROMPT 2 — AC2 + AC5: Relocação de Componentes Auth + Consistência de Imports

```
Analise o diff abaixo e avalie os Acceptance Criteria #2 e #5 da story DI.1.

**Acceptance Criterion #2:**
> - `src/components/login-form.tsx` movido para `src/features/auth/components/login-form.tsx`
> - `src/components/nav-user.tsx` movido para `src/features/auth/components/nav-user.tsx`
> - Todos os imports no codebase atualizados para os novos paths

**Acceptance Criterion #5 (Import Consistency):**
> Todo código refatorado usa o alias `@/` e referencia as constantes do `routes.ts` em vez de strings hardcoded onde rotas aparecem

**Diff das mudanças:**
[COLE O OUTPUT DE git diff main...HEAD AQUI]

**Avalie cada item abaixo e responda com uma tabela PASS / FAIL / WARN:**

| Item | Status | Justificativa |
|------|--------|---------------|
| `src/features/auth/components/login-form.tsx` existe no diff (arquivo criado/movido) | | |
| `src/features/auth/components/nav-user.tsx` existe no diff (arquivo criado/movido) | | |
| `src/components/login-form.tsx` foi removido (não aparece mais no codebase) | | |
| `src/components/nav-user.tsx` foi removido (não aparece mais no codebase) | | |
| Nenhum arquivo no diff ainda importa de `@/components/login-form` | | |
| Nenhum arquivo no diff ainda importa de `@/components/nav-user` | | |
| Todos os imports dos componentes movidos usam o alias `@/` (não paths relativos `../../`) | | |
| `src/middleware.ts` usa `ROUTES.*` em vez de strings literais para rotas | | |
| Outros arquivos com rotas hardcoded também foram migrados para `ROUTES.*` | | |

**Após a tabela:**
- Liste qualquer import dangling encontrado (path antigo ainda sendo referenciado)
- Se tudo passar, escreva "AC2 + AC5: APROVADOS"
```

---

## PROMPT 3 — AC4: Não-Regressão (Análise Estática do Middleware)

```
Analise o diff abaixo para detectar possíveis regressões introduzidas pelo refactoring da DI.1.

**Acceptance Criterion #4:**
> `npm run build`, `npm run lint` e `npm run test` passam após o refactoring. Sem mudança comportamental no app.

**VERSÃO ORIGINAL de `src/middleware.ts` (baseline para comparação):**
```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/sign-up";
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin");

    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    // RBAC for /admin route
    if (user && request.nextUrl.pathname.startsWith("/admin")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
```

**Diff das mudanças em `src/middleware.ts`:**
[COLE APENAS O DIFF DE src/middleware.ts AQUI — output de: git diff main...HEAD -- src/middleware.ts]

**Avalie cada comportamento e responda com uma tabela PASS / FAIL / WARN:**

| Comportamento | Status | Justificativa |
|--------------|--------|---------------|
| Usuário não autenticado em `/dashboard` redireciona para `/auth/login` | | |
| Usuário não autenticado em `/admin` redireciona para `/auth/login` | | |
| Usuário autenticado em `/auth` ou `/login` redireciona para `/dashboard` | | |
| RBAC: usuário sem role `admin` em `/admin` redireciona para `/dashboard` | | |
| RBAC: usuário com role `admin` em `/admin` tem acesso liberado | | |
| Rotas públicas não são bloqueadas indevidamente | | |
| O `config.matcher` permanece idêntico ao original | | |
| Nenhum import novo introduz dependência inesperada | | |
| Uso de `ROUTES.*` no middleware preserva os mesmos valores de string das rotas originais | | |

**Após a tabela:**
- Identifique qualquer mudança de comportamento sutil (ex: rota `/sign-up` vs `/signup`, `/auth/login` vs `/login`)
- Verifique se os valores de `ROUTES.*` usados batem exatamente com as strings hardcoded originais
- Se tudo passar, escreva "AC4: APROVADO (análise estática)"

> **Nota:** Esta análise é estática. A aprovação definitiva do AC4 requer execução real de `npm run build`, `npm run lint` e `npm run test`.
```
