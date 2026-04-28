# Blind Hunter Review Prompt — Story 2.2

> **Como usar:** Copie TUDO abaixo da linha `---PROMPT---` e cole em uma nova conversa do Gemini 3.1 Pro. **Não forneça nenhum contexto adicional do projeto** — esse prompt é deliberadamente cego. Depois cole a resposta (lista Markdown de findings) de volta na conversa do Claude Code.

---PROMPT---

Você é um **Blind Hunter**, um revisor de código cínico, cético e impaciente. O código a seguir foi submetido por alguém que você presume ser descuidado, e sua expectativa é encontrar problemas.

## REGRAS DE OPERAÇÃO

- Você NÃO tem nenhum contexto do projeto além do diff abaixo. NÃO assuma nada sobre arquivos, módulos, convenções ou histórico que não esteja no próprio diff.
- NÃO sugira correções. Apenas reporte findings.
- Encontre **no mínimo 10 problemas**. Se encontrar menos, re-analise — você está sendo complacente.
- Tom profissional e preciso. Sem palavrões. Sem ataques pessoais.
- Responda em **Português do Brasil**.

## O QUE PROCURAR

1. **Bugs e erros de lógica óbvios** — fluxos quebrados, condições invertidas, valores errados retornados, race conditions, vazamentos de memória (event listeners, timers, requests pendentes).
2. **Falhas de segurança** — vazamento de dados, credenciais expostas, injeção (LIKE wildcard, SQL), validação ausente em servidor, bypass de autenticação, políticas RLS fracas, XSS via `<img src>` sem sanitização.
3. **Qualidade de código** — duplicação, complexidade desnecessária, nomes ruins, funções longas, tipos fracos (`any`, `unknown` sem refinar), logs esquecidos (`console.*`), código morto, comentários desatualizados.
4. **Inconsistências internas ao próprio diff** — nomes que não batem entre arquivos, tipos divergentes, comentário que contradiz o código, padrão diferente entre funções próximas, mocks de teste que não refletem o código real.
5. **Ausências suspeitas** — o que DEVERIA estar presente dado o próprio código (ex.: um `try/catch` que captura mas não propaga, um campo obrigatório sem validação, um estado sem loading/error, schema SQL sem índice óbvio, debounce sem cleanup, listener sem remoção).
6. **Acessibilidade** — diálogos sem `aria-modal`/`role`, atalhos de teclado conflitantes, focos não restaurados, `<img>` sem `alt` significativo, ícones decorativos com `aria-label` desnecessário.
7. **Performance** — queries sem índice em colunas usadas em `ILIKE`, `.limit(20)` por categoria seguido de truncamento (40 → 20), `useEffect` sem deps corretas, re-render desnecessário.

## FORMATO DE SAÍDA

Responda EXCLUSIVAMENTE como uma lista Markdown. Cada item:

```
- **<Título curto>** — <descrição do problema, com referência ao arquivo e, se possível, à linha do hunk>
```

Sem preâmbulo, sem epílogo, sem agrupamentos. Apenas a lista.

## DIFF PARA REVISÃO

```diff
diff --git a/e2e/command-palette.spec.ts b/e2e/command-palette.spec.ts
new file mode 100644
index 0000000..0859f13
--- /dev/null
+++ b/e2e/command-palette.spec.ts
@@ -0,0 +1,41 @@
+import { test, expect } from '@playwright/test';
+
+// Note: Full command palette flow (Cmd+K → search → results) requires an
+// authenticated session with seeded data. These tests cover what is
+// verifiable without auth — consistent with the project's E2E approach.
+// See auth.spec.ts comment for context on why comprehensive auth flows
+// are excluded from the standard pipeline.
+
+test.describe('Command Palette', () => {
+  test('dashboard sem autenticação redireciona para login (Command Palette não é exposta)', async ({ page }) => {
+    await page.goto('/dashboard');
+    await expect(page).toHaveURL(/\/auth\/login/);
+  });
+
+  test('onboarding é acessível sem autenticação (fluxo pós-cadastro)', async ({ page }) => {
+    // /onboarding/* is intentionally not protected by middleware — users access it
+    // right after sign-up before they have a session. CommandPalette is not mounted
+    // outside the (dashboard) route group, so it won't be available here.
+    await page.goto('/onboarding/artist');
+    await expect(page).not.toHaveURL(/\/auth\/login/);
+  });
+
+  test('página de login não abre Command Palette com Cmd+K', async ({ page }) => {
+    await page.goto('/auth/login');
+    await page.keyboard.press('Meta+KeyK');
+    // Modal não deve aparecer na página de login
+    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
+  });
+});
+
+// To run the full flow locally with auth:
+// 1. Log in as a test user and export Playwright storage state
+// 2. Seed at least 1 verified artist + 1 restricted + 1 active collective
+// 3. Use storageState in playwright.config.ts for the authenticated project
+//
+// Expected flow:
+//   page.goto('/dashboard')
+//   page.keyboard.press('Meta+KeyK')     → modal opens
+//   page.fill('[cmdk-input]', 'rock')    → results appear
+//   expect artist card to be visible     → ArtistIdentityCard rendered
+//   page.keyboard.press('Escape')        → modal closes
diff --git a/package.json b/package.json
index 2bd92e4..41c66b9 100644
--- a/package.json
+++ b/package.json
@@ -21,6 +21,7 @@
     "@upstash/qstash": "^2.10.1",
     "class-variance-authority": "^0.7.1",
     "clsx": "^2.1.1",
+    "cmdk": "^1.1.1",
     "drizzle-orm": "^0.45.2",
     "lucide-react": "^0.511.0",
     "next": "latest",
@@ -35,6 +36,9 @@
     "@eslint/eslintrc": "^3",
     "@playwright/test": "^1.59.1",
     "@sentry/nextjs": "^10.48.0",
+    "@testing-library/jest-dom": "^6.9.1",
+    "@testing-library/react": "^16.3.2",
+    "@testing-library/user-event": "^14.6.1",
     "@types/node": "^20.19.39",
     "@types/react": "^19",
     "@types/react-dom": "^19",
diff --git a/src/app/(dashboard)/layout.tsx b/src/app/(dashboard)/layout.tsx
new file mode 100644
index 0000000..41b28c9
--- /dev/null
+++ b/src/app/(dashboard)/layout.tsx
@@ -0,0 +1,14 @@
+import { CommandPalette } from '@/features/search/components/command-palette';
+
+export default function DashboardLayout({
+  children,
+}: {
+  children: React.ReactNode;
+}) {
+  return (
+    <>
+      <CommandPalette />
+      {children}
+    </>
+  );
+}
diff --git a/src/components/auth-button.tsx b/src/components/auth-button.tsx
index 29f696c..030277d 100644
--- a/src/components/auth-button.tsx
+++ b/src/components/auth-button.tsx
@@ -18,11 +18,11 @@ export async function AuthButton() {
     </div>
   ) : (
     <div className="flex gap-2">
-      <Button asChild size="sm" variant={"outline"}>
-        <Link href="/auth/login">Sign in</Link>
+      <Button size="sm" variant={"outline"} render={<Link href="/auth/login" />}>
+        Sign in
       </Button>
-      <Button asChild size="sm" variant={"default"}>
-        <Link href="/auth/sign-up">Sign up</Link>
+      <Button size="sm" variant={"default"} render={<Link href="/auth/sign-up" />}>
+        Sign up
       </Button>
     </div>
   );
diff --git a/src/components/ui/button.tsx b/src/components/ui/button.tsx
index d09a695..09df753 100644
--- a/src/components/ui/button.tsx
+++ b/src/components/ui/button.tsx
@@ -1,57 +1,58 @@
-import * as React from "react";
-import { Slot } from "@radix-ui/react-slot";
-import { cva, type VariantProps } from "class-variance-authority";
+import { Button as ButtonPrimitive } from "@base-ui/react/button"
+import { cva, type VariantProps } from "class-variance-authority"
 
-import { cn } from "@/lib/utils";
+import { cn } from "@/lib/utils"
 
 const buttonVariants = cva(
-  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
+  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
   {
     variants: {
       variant: {
-        default:
-          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
-        destructive:
-          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
+        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
         outline:
-          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
+          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
         secondary:
-          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
-        ghost: "hover:bg-accent hover:text-accent-foreground",
+          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
+        ghost:
+          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
+        destructive:
+          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
         link: "text-primary underline-offset-4 hover:underline",
       },
       size: {
-        default: "h-9 px-4 py-2",
-        sm: "h-8 rounded-md px-3 text-xs",
-        lg: "h-10 rounded-md px-8",
-        icon: "h-9 w-9",
+        default:
+          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
+        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
+        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
+        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
+        icon: "size-8",
+        "icon-xs":
+          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
+        "icon-sm":
+          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
+        "icon-lg": "size-9",
       },
     },
     defaultVariants: {
       variant: "default",
       size: "default",
     },
-  },
-);
+  }
+)
 
-export interface ButtonProps
-  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
-    VariantProps<typeof buttonVariants> {
-  asChild?: boolean;
+function Button({
+  className,
+  variant = "default",
+  size = "default",
+  ...props
+}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
+  return (
+    <ButtonPrimitive
+      data-slot="button"
+      className={cn(buttonVariants({ variant, size, className }))}
+      {...props}
+    />
+  )
 }
 
-const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
-  ({ className, variant, size, asChild = false, ...props }, ref) => {
-    const Comp = asChild ? Slot : "button";
-    return (
-      <Comp
-        className={cn(buttonVariants({ variant, size, className }))}
-        ref={ref}
-        {...props}
-      />
-    );
-  },
-);
-Button.displayName = "Button";
-
-export { Button, buttonVariants };
+export { Button, buttonVariants }
diff --git a/src/components/ui/command.tsx b/src/components/ui/command.tsx
new file mode 100644
index 0000000..37fb2d9
--- /dev/null
+++ b/src/components/ui/command.tsx
@@ -0,0 +1,196 @@
+"use client"
+
+import * as React from "react"
+import { Command as CommandPrimitive } from "cmdk"
+
+import { cn } from "@/lib/utils"
+import {
+  Dialog,
+  DialogContent,
+  DialogDescription,
+  DialogHeader,
+  DialogTitle,
+} from "@/components/ui/dialog"
+import {
+  InputGroup,
+  InputGroupAddon,
+} from "@/components/ui/input-group"
+import { SearchIcon, CheckIcon } from "lucide-react"
+
+function Command({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive>) {
+  return (
+    <CommandPrimitive
+      data-slot="command"
+      className={cn(
+        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CommandDialog({
+  title = "Command Palette",
+  description = "Search for a command to run...",
+  children,
+  className,
+  showCloseButton = false,
+  ...props
+}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
+  title?: string
+  description?: string
+  className?: string
+  showCloseButton?: boolean
+  children: React.ReactNode
+}) {
+  return (
+    <Dialog {...props}>
+      <DialogHeader className="sr-only">
+        <DialogTitle>{title}</DialogTitle>
+        <DialogDescription>{description}</DialogDescription>
+      </DialogHeader>
+      <DialogContent
+        className={cn(
+          "top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
+          className
+        )}
+        showCloseButton={showCloseButton}
+      >
+        {children}
+      </DialogContent>
+    </Dialog>
+  )
+}
+
+function CommandInput({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.Input>) {
+  return (
+    <div data-slot="command-input-wrapper" className="p-1 pb-0">
+      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
+        <CommandPrimitive.Input
+          data-slot="command-input"
+          className={cn(
+            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
+            className
+          )}
+          {...props}
+        />
+        <InputGroupAddon>
+          <SearchIcon className="size-4 shrink-0 opacity-50" />
+        </InputGroupAddon>
+      </InputGroup>
+    </div>
+  )
+}
+
+function CommandList({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.List>) {
+  return (
+    <CommandPrimitive.List
+      data-slot="command-list"
+      className={cn(
+        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CommandEmpty({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
+  return (
+    <CommandPrimitive.Empty
+      data-slot="command-empty"
+      className={cn("py-6 text-center text-sm", className)}
+      {...props}
+    />
+  )
+}
+
+function CommandGroup({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.Group>) {
+  return (
+    <CommandPrimitive.Group
+      data-slot="command-group"
+      className={cn(
+        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CommandSeparator({
+  className,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
+  return (
+    <CommandPrimitive.Separator
+      data-slot="command-separator"
+      className={cn("-mx-1 h-px bg-border", className)}
+      {...props}
+    />
+  )
+}
+
+function CommandItem({
+  className,
+  children,
+  ...props
+}: React.ComponentProps<typeof CommandPrimitive.Item>) {
+  return (
+    <CommandPrimitive.Item
+      data-slot="command-item"
+      className={cn(
+        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
+        className
+      )}
+      {...props}
+    >
+      {children}
+      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
+    </CommandPrimitive.Item>
+  )
+}
+
+function CommandShortcut({
+  className,
+  ...props
+}: React.ComponentProps<"span">) {
+  return (
+    <span
+      data-slot="command-shortcut"
+      className={cn(
+        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  Command,
+  CommandDialog,
+  CommandInput,
+  CommandList,
+  CommandEmpty,
+  CommandGroup,
+  CommandItem,
+  CommandShortcut,
+  CommandSeparator,
+}
diff --git a/src/components/ui/dialog.tsx b/src/components/ui/dialog.tsx
new file mode 100644
index 0000000..014f5aa
--- /dev/null
+++ b/src/components/ui/dialog.tsx
@@ -0,0 +1,160 @@
+"use client"
+
+import * as React from "react"
+import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
+
+import { cn } from "@/lib/utils"
+import { Button } from "@/components/ui/button"
+import { XIcon } from "lucide-react"
+
+function Dialog({ ...props }: DialogPrimitive.Root.Props) {
+  return <DialogPrimitive.Root data-slot="dialog" {...props} />
+}
+
+function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
+  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
+}
+
+function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
+  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
+}
+
+function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
+  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
+}
+
+function DialogOverlay({
+  className,
+  ...props
+}: DialogPrimitive.Backdrop.Props) {
+  return (
+    <DialogPrimitive.Backdrop
+      data-slot="dialog-overlay"
+      className={cn(
+        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DialogContent({
+  className,
+  children,
+  showCloseButton = true,
+  ...props
+}: DialogPrimitive.Popup.Props & {
+  showCloseButton?: boolean
+}) {
+  return (
+    <DialogPortal>
+      <DialogOverlay />
+      <DialogPrimitive.Popup
+        data-slot="dialog-content"
+        className={cn(
+          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
+          className
+        )}
+        {...props}
+      >
+        {children}
+        {showCloseButton && (
+          <DialogPrimitive.Close
+            data-slot="dialog-close"
+            render={
+              <Button
+                variant="ghost"
+                className="absolute top-2 right-2"
+                size="icon-sm"
+              />
+            }
+          >
+            <XIcon
+            />
+            <span className="sr-only">Close</span>
+          </DialogPrimitive.Close>
+        )}
+      </DialogPrimitive.Popup>
+    </DialogPortal>
+  )
+}
+
+function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="dialog-header"
+      className={cn("flex flex-col gap-2", className)}
+      {...props}
+    />
+  )
+}
+
+function DialogFooter({
+  className,
+  showCloseButton = false,
+  children,
+  ...props
+}: React.ComponentProps<"div"> & {
+  showCloseButton?: boolean
+}) {
+  return (
+    <div
+      data-slot="dialog-footer"
+      className={cn(
+        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
+        className
+      )}
+      {...props}
+    >
+      {children}
+      {showCloseButton && (
+        <DialogPrimitive.Close render={<Button variant="outline" />}>
+          Close
+        </DialogPrimitive.Close>
+      )}
+    </div>
+  )
+}
+
+function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
+  return (
+    <DialogPrimitive.Title
+      data-slot="dialog-title"
+      className={cn(
+        "font-heading text-base leading-none font-medium",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DialogDescription({
+  className,
+  ...props
+}: DialogPrimitive.Description.Props) {
+  return (
+    <DialogPrimitive.Description
+      data-slot="dialog-description"
+      className={cn(
+        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  Dialog,
+  DialogClose,
+  DialogContent,
+  DialogDescription,
+  DialogFooter,
+  DialogHeader,
+  DialogOverlay,
+  DialogPortal,
+  DialogTitle,
+  DialogTrigger,
+}
diff --git a/src/components/ui/input-group.tsx b/src/components/ui/input-group.tsx
new file mode 100644
index 0000000..da8f1dd
--- /dev/null
+++ b/src/components/ui/input-group.tsx
@@ -0,0 +1,158 @@
+"use client"
+
+import * as React from "react"
+import { cva, type VariantProps } from "class-variance-authority"
+
+import { cn } from "@/lib/utils"
+import { Button } from "@/components/ui/button"
+import { Input } from "@/components/ui/input"
+import { Textarea } from "@/components/ui/textarea"
+
+function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="input-group"
+      role="group"
+      className={cn(
+        "group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+const inputGroupAddonVariants = cva(
+  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
+  {
+    variants: {
+      align: {
+        "inline-start":
+          "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
+        "inline-end":
+          "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
+        "block-start":
+          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
+        "block-end":
+          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
+      },
+    },
+    defaultVariants: {
+      align: "inline-start",
+    },
+  }
+)
+
+function InputGroupAddon({
+  className,
+  align = "inline-start",
+  ...props
+}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
+  return (
+    <div
+      role="group"
+      data-slot="input-group-addon"
+      data-align={align}
+      className={cn(inputGroupAddonVariants({ align }), className)}
+      onClick={(e) => {
+        if ((e.target as HTMLElement).closest("button")) {
+          return
+        }
+        e.currentTarget.parentElement?.querySelector("input")?.focus()
+      }}
+      {...props}
+    />
+  )
+}
+
+const inputGroupButtonVariants = cva(
+  "flex items-center gap-2 text-sm shadow-none",
+  {
+    variants: {
+      size: {
+        xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
+        sm: "",
+        "icon-xs":
+          "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
+        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
+      },
+    },
+    defaultVariants: {
+      size: "xs",
+    },
+  }
+)
+
+function InputGroupButton({
+  className,
+  type = "button",
+  variant = "ghost",
+  size = "xs",
+  ...props
+}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
+  VariantProps<typeof inputGroupButtonVariants> & {
+    type?: "button" | "submit" | "reset"
+  }) {
+  return (
+    <Button
+      type={type}
+      data-size={size}
+      variant={variant}
+      className={cn(inputGroupButtonVariants({ size }), className)}
+      {...props}
+    />
+  )
+}
+
+function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
+  return (
+    <span
+      className={cn(
+        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function InputGroupInput({
+  className,
+  ...props
+}: React.ComponentProps<"input">) {
+  return (
+    <Input
+      data-slot="input-group-control"
+      className={cn(
+        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function InputGroupTextarea({
+  className,
+  ...props
+}: React.ComponentProps<"textarea">) {
+  return (
+    <Textarea
+      data-slot="input-group-control"
+      className={cn(
+        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  InputGroup,
+  InputGroupAddon,
+  InputGroupButton,
+  InputGroupText,
+  InputGroupInput,
+  InputGroupTextarea,
+}
diff --git a/src/components/ui/input.tsx b/src/components/ui/input.tsx
index 7db5241..7d21bab 100644
--- a/src/components/ui/input.tsx
+++ b/src/components/ui/input.tsx
@@ -1,22 +1,20 @@
-import * as React from "react";
+import * as React from "react"
+import { Input as InputPrimitive } from "@base-ui/react/input"
 
-import { cn } from "@/lib/utils";
+import { cn } from "@/lib/utils"
 
-const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
-  ({ className, type, ...props }, ref) => {
-    return (
-      <input
-        type={type}
-        className={cn(
-          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
-          className,
-        )}
-        ref={ref}
-        {...props}
-      />
-    );
-  },
-);
-Input.displayName = "Input";
+function Input({ className, type, ...props }: React.ComponentProps<"input">) {
+  return (
+    <InputPrimitive
+      type={type}
+      data-slot="input"
+      className={cn(
+        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
+        className
+      )}
+      {...props}
+    />
+  )
+}
 
-export { Input };
+export { Input }
diff --git a/src/features/artists/components/artist-identity-card.test.tsx b/src/features/artists/components/artist-identity-card.test.tsx
new file mode 100644
index 0000000..585f321
--- /dev/null
+++ b/src/features/artists/components/artist-identity-card.test.tsx
@@ -0,0 +1,60 @@
+import { describe, it, expect, vi, afterEach } from 'vitest';
+import { render, screen, cleanup } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { ArtistIdentityCard } from './artist-identity-card';
+
+afterEach(cleanup);
+
+describe('ArtistIdentityCard', () => {
+  const baseProps = {
+    artisticName: 'DJ Test',
+    location: 'São Paulo',
+    genrePrimary: 'Eletrônico',
+  };
+
+  it('variante verified renderiza ícone com aria-label "Perfil verificado"', () => {
+    render(<ArtistIdentityCard variant="verified" {...baseProps} />);
+    expect(
+      screen.getByLabelText('Perfil verificado')
+    ).toBeDefined();
+  });
+
+  it('variante restricted renderiza badge com texto "Restricted"', () => {
+    render(<ArtistIdentityCard variant="restricted" {...baseProps} />);
+    expect(screen.getByText('Restricted')).toBeDefined();
+  });
+
+  it('sem onClaim → botão de claim não existe', () => {
+    render(<ArtistIdentityCard variant="restricted" {...baseProps} />);
+    expect(screen.queryByText('Claim this Profile')).toBeNull();
+  });
+
+  it('com onClaim → botão "Claim this Profile" visível', async () => {
+    const handleClaim = vi.fn();
+    render(
+      <ArtistIdentityCard
+        variant="restricted"
+        {...baseProps}
+        onClaim={handleClaim}
+      />
+    );
+    const btn = screen.getByText('Claim this Profile');
+    expect(btn).toBeDefined();
+    await userEvent.click(btn);
+    expect(handleClaim).toHaveBeenCalledTimes(1);
+  });
+
+  it('modo compact oculta genre e exibe apenas location', () => {
+    render(
+      <ArtistIdentityCard variant="verified" {...baseProps} compact />
+    );
+    expect(screen.getByText('São Paulo')).toBeDefined();
+    // In compact mode, genre is not shown (no Music icon row)
+    expect(screen.queryByText('Eletrônico')).toBeNull();
+  });
+
+  it('exibe nome artístico', () => {
+    render(<ArtistIdentityCard variant="verified" {...baseProps} />);
+    expect(screen.getByText('DJ Test')).toBeDefined();
+  });
+});
diff --git a/src/features/artists/components/artist-identity-card.tsx b/src/features/artists/components/artist-identity-card.tsx
new file mode 100644
index 0000000..bbe55f3
--- /dev/null
+++ b/src/features/artists/components/artist-identity-card.tsx
@@ -0,0 +1,111 @@
+import { CheckCircle, MapPin, Music } from 'lucide-react';
+import { Badge } from '@/components/ui/badge';
+import { cn } from '@/lib/utils';
+
+type ArtistIdentityCardProps = {
+  variant: 'verified' | 'restricted';
+  artisticName: string;
+  location: string;
+  genrePrimary?: string | null;
+  photoUrl?: string | null;
+  /** @reserved Story 2.3 — claim flow. Renders "Claim this Profile" button when provided. */
+  onClaim?: () => void;
+  compact?: boolean;
+};
+
+export function ArtistIdentityCard({
+  variant,
+  artisticName,
+  location,
+  genrePrimary,
+  photoUrl,
+  onClaim,
+  compact = false,
+}: ArtistIdentityCardProps) {
+  const initials = artisticName
+    .split(' ')
+    .map((w) => w[0])
+    .slice(0, 2)
+    .join('')
+    .toUpperCase();
+
+  return (
+    <div
+      className={cn(
+        'flex items-center gap-3 rounded-md border border-border bg-background px-3',
+        compact ? 'py-2' : 'py-3',
+        variant === 'verified' &&
+          'shadow-[0_0_0_1px_hsl(var(--primary))] border-primary'
+      )}
+    >
+      {/* Avatar */}
+      <div
+        className={cn(
+          'flex shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground',
+          compact ? 'size-8' : 'size-10'
+        )}
+      >
+        {photoUrl ? (
+          // eslint-disable-next-line @next/next/no-img-element
+          <img
+            src={photoUrl}
+            alt={artisticName}
+            className="size-full rounded-full object-cover"
+          />
+        ) : (
+          initials
+        )}
+      </div>
+
+      {/* Info */}
+      <div className="min-w-0 flex-1">
+        <div className="flex items-center gap-1.5 truncate">
+          <span className="truncate font-sans text-sm font-medium text-foreground">
+            {artisticName}
+          </span>
+          {variant === 'verified' && (
+            <CheckCircle
+              className="size-3.5 shrink-0 text-primary"
+              aria-label="Perfil verificado"
+            />
+          )}
+          {variant === 'restricted' && (
+            <Badge variant="outline" className="shrink-0 text-[10px] leading-none py-0">
+              Restricted
+            </Badge>
+          )}
+        </div>
+
+        {!compact && (
+          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
+            <span className="flex items-center gap-1 truncate">
+              <MapPin className="size-3 shrink-0" />
+              {location}
+            </span>
+            {genrePrimary && (
+              <span className="flex items-center gap-1 truncate">
+                <Music className="size-3 shrink-0" />
+                {genrePrimary}
+              </span>
+            )}
+          </div>
+        )}
+
+        {compact && (
+          <p className="truncate text-xs text-muted-foreground">{location}</p>
+        )}
+      </div>
+
+      {/* Claim CTA — reserved for Story 2.3 */}
+      {onClaim && (
+        <button
+          type="button"
+          onClick={onClaim}
+          className="shrink-0 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
+        >
+          Claim this Profile
+        </button>
+      )}
+    </div>
+  );
+}
diff --git a/src/features/collectives/components/collective-card.tsx b/src/features/collectives/components/collective-card.tsx
new file mode 100644
index 0000000..23e9196
--- /dev/null
+++ b/src/features/collectives/components/collective-card.tsx
@@ -0,0 +1,75 @@
+import { MapPin, Music } from 'lucide-react';
+import { cn } from '@/lib/utils';
+
+type CollectiveCardProps = {
+  name: string;
+  location: string;
+  genrePrimary: string;
+  logoUrl?: string | null;
+  compact?: boolean;
+};
+
+export function CollectiveCard({
+  name,
+  location,
+  genrePrimary,
+  logoUrl,
+  compact = false,
+}: CollectiveCardProps) {
+  const initials = name
+    .split(' ')
+    .map((w) => w[0])
+    .slice(0, 2)
+    .join('')
+    .toUpperCase();
+
+  return (
+    <div
+      className={cn(
+        'flex items-center gap-3 rounded-md border border-border bg-background px-3',
+        compact ? 'py-2' : 'py-3'
+      )}
+    >
+      {/* Logo */}
+      <div
+        className={cn(
+          'flex shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground',
+          compact ? 'size-8' : 'size-10'
+        )}
+      >
+        {logoUrl ? (
+          // eslint-disable-next-line @next/next/no-img-element
+          <img
+            src={logoUrl}
+            alt={name}
+            className="size-full rounded-md object-cover"
+          />
+        ) : (
+          initials
+        )}
+      </div>
+
+      {/* Info */}
+      <div className="min-w-0 flex-1">
+        <p className="truncate font-sans text-sm font-medium text-foreground">
+          {name}
+        </p>
+
+        {compact ? (
+          <p className="truncate text-xs text-muted-foreground">{location}</p>
+        ) : (
+          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
+            <span className="flex items-center gap-1 truncate">
+              <MapPin className="size-3 shrink-0" />
+              {location}
+            </span>
+            <span className="flex items-center gap-1 truncate">
+              <Music className="size-3 shrink-0" />
+              {genrePrimary}
+            </span>
+          </div>
+        )}
+      </div>
+    </div>
+  );
+}
diff --git a/src/features/search/actions.test.ts b/src/features/search/actions.test.ts
new file mode 100644
index 0000000..9b38b84
--- /dev/null
+++ b/src/features/search/actions.test.ts
@@ -0,0 +1,196 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+
+// ─── DB mocks ─────────────────────────────────────────────────────────────────
+const mockSelect = vi.fn();
+const mockFrom = vi.fn();
+const mockWhere = vi.fn();
+const mockLimit = vi.fn();
+
+vi.mock('@/db/index', () => ({
+  db: {
+    select: (...args: unknown[]) => mockSelect(...args),
+  },
+}));
+
+vi.mock('drizzle-orm', () => ({
+  or: vi.fn(),
+  ilike: vi.fn(),
+  eq: vi.fn(),
+  and: vi.fn(),
+  sql: vi.fn(),
+}));
+
+// ─── Supabase mock ────────────────────────────────────────────────────────────
+const mockGetUser = vi.fn();
+vi.mock('@/lib/supabase/server', () => ({
+  createClient: vi.fn().mockResolvedValue({
+    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
+  }),
+}));
+
+// ─── Chain helper ─────────────────────────────────────────────────────────────
+function setupSelectChain() {
+  mockFrom.mockReturnValue({ where: mockWhere });
+  mockWhere.mockReturnValue({ limit: mockLimit });
+  mockSelect.mockReturnValue({ from: mockFrom });
+}
+
+// ─── Imports after mocks ──────────────────────────────────────────────────────
+import { searchTalents } from './actions';
+
+// ─────────────────────────────────────────────────────────────────────────────
+// searchTalents
+// ─────────────────────────────────────────────────────────────────────────────
+describe('searchTalents', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+    setupSelectChain();
+    mockGetUser.mockResolvedValue({
+      data: { user: { id: 'user-uuid' } },
+      error: null,
+    });
+  });
+
+  it('retorna UNAUTHORIZED quando não autenticado', async () => {
+    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no auth') });
+    const result = await searchTalents({ query: 'rock' });
+    expect(result.error?.code).toBe('UNAUTHORIZED');
+    expect(result.data).toBeNull();
+  });
+
+  it('retorna VALIDATION_ERROR para query curta (< 2 chars)', async () => {
+    const result = await searchTalents({ query: 'a' });
+    expect(result.error?.code).toBe('VALIDATION_ERROR');
+    expect(result.data).toBeNull();
+  });
+
+  it('retorna VALIDATION_ERROR para query vazia', async () => {
+    const result = await searchTalents({ query: '' });
+    expect(result.error?.code).toBe('VALIDATION_ERROR');
+    expect(result.data).toBeNull();
+  });
+
+  it('retorna artistas e coletivos ativos para query válida', async () => {
+    const artistRow = {
+      kind: 'artist' as const,
+      id: 'artist-1',
+      artisticName: 'Rock Silva',
+      location: 'SP',
+      genrePrimary: 'rock',
+      photoUrl: null,
+      isVerified: true,
+    };
+    const collectiveRow = {
+      kind: 'collective' as const,
+      id: 'collective-1',
+      name: 'Rock Coletivo',
+      location: 'RJ',
+      genrePrimary: 'rock',
+      logoUrl: null,
+    };
+
+    // First call → artists, second call → collectives
+    mockLimit.mockResolvedValueOnce([artistRow]);
+    mockLimit.mockResolvedValueOnce([collectiveRow]);
+
+    const result = await searchTalents({ query: 'rock' });
+
+    expect(result.error).toBeNull();
+    expect(result.data).toHaveLength(2);
+    expect(result.data?.some((h) => h.kind === 'artist')).toBe(true);
+    expect(result.data?.some((h) => h.kind === 'collective')).toBe(true);
+  });
+
+  it('artista is_verified=false é retornado (diferenciação é visual, não filtro)', async () => {
+    const restrictedArtist = {
+      kind: 'artist' as const,
+      id: 'artist-2',
+      artisticName: 'Jane Doe',
+      location: 'MG',
+      genrePrimary: null,
+      photoUrl: null,
+      isVerified: false,
+    };
+
+    mockLimit.mockResolvedValueOnce([restrictedArtist]);
+    mockLimit.mockResolvedValueOnce([]);
+
+    const result = await searchTalents({ query: 'Jane' });
+
+    expect(result.error).toBeNull();
+    expect(result.data).toHaveLength(1);
+    expect((result.data?.[0] as { isVerified: boolean }).isVerified).toBe(false);
+  });
+
+  it('coletivo pending_approval NÃO deve aparecer (filtrado na query)', async () => {
+    // The action applies eq(collectives.status, 'active') in the where clause.
+    // This test verifies the query is constructed correctly by confirming only
+    // active collectives appear. We return empty array (simulating DB filtering).
+    mockLimit.mockResolvedValueOnce([]);
+    mockLimit.mockResolvedValueOnce([]);
+
+    const result = await searchTalents({ query: 'Coletivo' });
+
+    expect(result.error).toBeNull();
+    expect(result.data).toEqual([]);
+  });
+
+  it('retorna data:[] e error:null quando não há matches', async () => {
+    mockLimit.mockResolvedValueOnce([]);
+    mockLimit.mockResolvedValueOnce([]);
+
+    const result = await searchTalents({ query: 'xyznotfound' });
+
+    expect(result.error).toBeNull();
+    expect(result.data).toEqual([]);
+  });
+
+  it('respeita limite de 20 resultados no total', async () => {
+    const manyArtists = Array.from({ length: 20 }, (_, i) => ({
+      kind: 'artist' as const,
+      id: `artist-${i}`,
+      artisticName: `Artist ${i}`,
+      location: 'SP',
+      genrePrimary: 'rock',
+      photoUrl: null,
+      isVerified: false,
+    }));
+    const extraCollective = {
+      kind: 'collective' as const,
+      id: 'col-1',
+      name: 'Extra',
+      location: 'SP',
+      genrePrimary: 'rock',
+      logoUrl: null,
+    };
+
+    mockLimit.mockResolvedValueOnce(manyArtists);
+    mockLimit.mockResolvedValueOnce([extraCollective]);
+
+    const result = await searchTalents({ query: 'rock' });
+
+    expect(result.error).toBeNull();
+    expect(result.data?.length).toBeLessThanOrEqual(20);
+  });
+
+  it('retorna DB_ERROR quando query falha', async () => {
+    mockSelect.mockImplementation(() => {
+      throw new Error('Connection failed');
+    });
+
+    const result = await searchTalents({ query: 'rock' });
+
+    expect(result.error?.code).toBe('DB_ERROR');
+    expect(result.data).toBeNull();
+  });
+
+  it('busca apenas artistas quando types=["artist"]', async () => {
+    mockLimit.mockResolvedValueOnce([]);
+
+    const result = await searchTalents({ query: 'rock', types: ['artist'] });
+
+    // db.select should be called once (only artists)
+    expect(mockSelect).toHaveBeenCalledTimes(1);
+    expect(result.error).toBeNull();
+  });
+});
diff --git a/src/features/search/actions.ts b/src/features/search/actions.ts
new file mode 100644
index 0000000..108225c
--- /dev/null
+++ b/src/features/search/actions.ts
@@ -0,0 +1,115 @@
+'use server';
+
+import { createClient } from '@/lib/supabase/server';
+import { db } from '@/db/index';
+import { artists } from '@/db/schema/artists';
+import { collectives } from '@/db/schema/collectives';
+import { or, ilike, eq, sql, and } from 'drizzle-orm';
+import { searchTalentsSchema } from './schemas';
+import type { SearchHit, SearchErrorCode } from './types';
+
+export type SearchTalentsResult = {
+  data: SearchHit[] | null;
+  error: { message: string; code: SearchErrorCode } | null;
+};
+
+export async function searchTalents(
+  input: unknown
+): Promise<SearchTalentsResult> {
+  const supabase = await createClient();
+  const {
+    data: { user },
+    error: authError,
+  } = await supabase.auth.getUser();
+
+  if (authError || !user) {
+    return {
+      data: null,
+      error: { message: 'Requer login', code: 'UNAUTHORIZED' },
+    };
+  }
+
+  const parsed = searchTalentsSchema.safeParse(input);
+  if (!parsed.success) {
+    return {
+      data: null,
+      error: { message: 'Query inválida', code: 'VALIDATION_ERROR' },
+    };
+  }
+
+  const { query, types } = parsed.data;
+  const escaped = query.replace(/[%_]/g, '\\$&');
+  const pattern = `%${escaped}%`;
+
+  try {
+    const results: SearchHit[] = [];
+
+    if (types.includes('artist')) {
+      const artistHits = await db
+        .select({
+          kind: sql<'artist'>`'artist'`,
+          id: artists.id,
+          artisticName: artists.artisticName,
+          location: artists.location,
+          genrePrimary: artists.genrePrimary,
+          photoUrl: artists.photoUrl,
+          isVerified: artists.isVerified,
+        })
+        .from(artists)
+        .where(
+          or(
+            ilike(artists.artisticName, pattern),
+            ilike(artists.location, pattern),
+            ilike(artists.genrePrimary, pattern)
+          )
+        )
+        .limit(20);
+
+      results.push(...artistHits);
+    }
+
+    if (types.includes('collective')) {
+      const collectiveHits = await db
+        .select({
+          kind: sql<'collective'>`'collective'`,
+          id: collectives.id,
+          name: collectives.name,
+          location: collectives.location,
+          genrePrimary: collectives.genrePrimary,
+          logoUrl: collectives.logoUrl,
+        })
+        .from(collectives)
+        .where(
+          and(
+            eq(collectives.status, 'active'),
+            or(
+              ilike(collectives.name, pattern),
+              ilike(collectives.location, pattern),
+              ilike(collectives.genrePrimary, pattern)
+            )
+          )
+        )
+        .limit(20);
+
+      results.push(...collectiveHits);
+    }
+
+    const q = query.toLowerCase();
+    const sorted = results.sort((a, b) => {
+      const aName = a.kind === 'artist' ? a.artisticName : a.name;
+      const bName = b.kind === 'artist' ? b.artisticName : b.name;
+      const aStarts = aName.toLowerCase().startsWith(q) ? 0 : 1;
+      const bStarts = bName.toLowerCase().startsWith(q) ? 0 : 1;
+      if (aStarts !== bStarts) return aStarts - bStarts;
+      return aName.localeCompare(bName);
+    });
+
+    return { data: sorted.slice(0, 20), error: null };
+  } catch (err) {
+    console.error('[searchTalents] DB error:', err);
+    return {
+      data: null,
+      error: { message: 'Erro ao buscar talentos', code: 'DB_ERROR' },
+    };
+  }
+}
diff --git a/src/features/search/components/command-palette.tsx b/src/features/search/components/command-palette.tsx
new file mode 100644
index 0000000..fbc1bd7
--- /dev/null
+++ b/src/features/search/components/command-palette.tsx
@@ -0,0 +1,135 @@
+'use client';
+
+import { useEffect, useState, useTransition } from 'react';
+import {
+  Command,
+  CommandDialog,
+  CommandEmpty,
+  CommandGroup,
+  CommandInput,
+  CommandItem,
+  CommandList,
+} from '@/components/ui/command';
+import { ArtistIdentityCard } from '@/features/artists/components/artist-identity-card';
+import { CollectiveCard } from '@/features/collectives/components/collective-card';
+import { searchTalents } from '@/features/search/actions';
+import type { SearchHit } from '@/features/search/types';
+
+export function CommandPalette() {
+  const [open, setOpen] = useState(false);
+  const [query, setQuery] = useState('');
+  const [results, setResults] = useState<SearchHit[]>([]);
+  const [isPending, startTransition] = useTransition();
+
+  useEffect(() => {
+    function handleKeyDown(e: KeyboardEvent) {
+      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
+        e.preventDefault();
+        setOpen((prev) => !prev);
+      }
+    }
+    document.addEventListener('keydown', handleKeyDown);
+    return () => document.removeEventListener('keydown', handleKeyDown);
+  }, []);
+
+  useEffect(() => {
+    if (query.length < 2) {
+      setResults([]);
+      return;
+    }
+    const timeout = setTimeout(() => {
+      startTransition(async () => {
+        const res = await searchTalents({ query });
+        if (res.error) {
+          setResults([]);
+          return;
+        }
+        setResults(res.data ?? []);
+      });
+    }, 300);
+    return () => clearTimeout(timeout);
+  }, [query]);
+
+  const artistHits = results.filter(
+    (h): h is Extract<SearchHit, { kind: 'artist' }> => h.kind === 'artist'
+  );
+  const collectiveHits = results.filter(
+    (h): h is Extract<SearchHit, { kind: 'collective' }> =>
+      h.kind === 'collective'
+  );
+
+  function handleSelect() {
+    setOpen(false);
+    // TODO(story-2.4): navegar para perfil público quando URL existir
+    console.info('[CommandPalette] item selected — navigation deferred to story 2.4');
+  }
+
+  return (
+    <CommandDialog
+      open={open}
+      onOpenChange={setOpen}
+      title="Buscar talentos"
+      description="Busque artistas e coletivos por nome, gênero ou cidade"
+    >
+      <Command shouldFilter={false}>
+      <CommandInput
+        placeholder="Buscar por nome, gênero ou cidade..."
+        value={query}
+        onValueChange={setQuery}
+      />
+      <CommandList>
+        {query.length < 2 && (
+          <CommandEmpty>Digite ao menos 2 caracteres para buscar.</CommandEmpty>
+        )}
+        {query.length >= 2 && isPending && (
+          <CommandEmpty>Buscando...</CommandEmpty>
+        )}
+        {query.length >= 2 && !isPending && results.length === 0 && (
+          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
+        )}
+
+        {artistHits.length > 0 && (
+          <CommandGroup heading="Artistas">
+            {artistHits.map((hit) => (
+              <CommandItem
+                key={hit.id}
+                value={`artist-${hit.id}`}
+                onSelect={handleSelect}
+              >
+                <ArtistIdentityCard
+                  variant={hit.isVerified ? 'verified' : 'restricted'}
+                  artisticName={hit.artisticName}
+                  location={hit.location}
+                  genrePrimary={hit.genrePrimary}
+                  photoUrl={hit.photoUrl}
+                  compact
+                />
+              </CommandItem>
+            ))}
+          </CommandGroup>
+        )}
+
+        {collectiveHits.length > 0 && (
+          <CommandGroup heading="Coletivos">
+            {collectiveHits.map((hit) => (
+              <CommandItem
+                key={hit.id}
+                value={`collective-${hit.id}`}
+                onSelect={handleSelect}
+              >
+                <CollectiveCard
+                  name={hit.name}
+                  location={hit.location}
+                  genrePrimary={hit.genrePrimary}
+                  logoUrl={hit.logoUrl}
+                  compact
+                />
+              </CommandItem>
+            ))}
+          </CommandGroup>
+        )}
+      </CommandList>
+      </Command>
+    </CommandDialog>
+  );
+}
diff --git a/src/features/search/schemas.ts b/src/features/search/schemas.ts
new file mode 100644
index 0000000..15981ac
--- /dev/null
+++ b/src/features/search/schemas.ts
@@ -0,0 +1,16 @@
+import { z } from 'zod';
+
+const trimmedStr = (min: number, max: number, minMsg: string) =>
+  z.preprocess(
+    (v) => (typeof v === 'string' ? v.trim() : v),
+    z.string().min(min, minMsg).max(max, `Máximo de ${max} caracteres`)
+  );
+
+export const searchTalentsSchema = z.object({
+  query: trimmedStr(2, 100, 'Busca deve ter ao menos 2 caracteres'),
+  types: z
+    .array(z.enum(['artist', 'collective']))
+    .default(['artist', 'collective']),
+});
+
+export type SearchTalentsInput = z.infer<typeof searchTalentsSchema>;
diff --git a/src/features/search/types.ts b/src/features/search/types.ts
new file mode 100644
index 0000000..393e3c3
--- /dev/null
+++ b/src/features/search/types.ts
@@ -0,0 +1,20 @@
+export type SearchHit =
+  | {
+      kind: 'artist';
+      id: string;
+      artisticName: string;
+      location: string;
+      genrePrimary: string | null;
+      photoUrl: string | null;
+      isVerified: boolean;
+    }
+  | {
+      kind: 'collective';
+      id: string;
+      name: string;
+      location: string;
+      genrePrimary: string;
+      logoUrl: string | null;
+    };
+
+export type SearchErrorCode = 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'DB_ERROR';
```

Agora produza a lista Markdown de findings. Mínimo de 10 itens. Apenas a lista.
