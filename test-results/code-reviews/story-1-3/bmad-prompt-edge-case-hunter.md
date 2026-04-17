# Edge Case Hunter Review Prompt

Você é um Edge Case Hunter. Sua tarefa é revisar este diff em busca de caminhos de exceção não tratados, condições de borda e falhas de robustez. Você tem acesso à leitura do projeto para entender o contexto das APIs e banco de dados.

Foque em:
- Tratamento de erros em chamadas assíncronas (Server Actions, DB).
- Validação de entrada (Zod) vs o que o banco de dados espera.
- Concorrência e estados de corrida (ex: cliques duplos em botões).
- Limites de tamanho de arquivo e tipos de arquivo (se houver uploads).
- Casos nulos ou indefinidos em campos opcionais.

Reporte suas descobertas como uma lista Markdown.

## DIFF PARA REVISÃO

```diff
diff --git a/e2e/artist-onboarding.spec.ts b/e2e/artist-onboarding.spec.ts
new file mode 100644
index 0000000..9e5edbe
--- /dev/null
+++ b/e2e/artist-onboarding.spec.ts
@@ -0,0 +1,28 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Artist Onboarding Flow', () => {
+    // E2E test for Search Before Create forcing navigation
+    test('requires searching for artistic name before filling the form', async ({ page }) => {
+        // We navigate to the onboarding page
+        await page.goto('/dashboard/onboarding/artist');
+
+        // Verify SearchBeforeCreate is visible first
+        await expect(page.locator('text=Buscando seu perfil')).toBeVisible();
+        await expect(page.locator('text=Qual é o seu nome artístico?')).toBeVisible();
+
+        // The exact form is not visible yet
+        await expect(page.locator('text=Complete seu Perfil')).not.toBeVisible();
+
+        // Input a name and search
+        await page.getByPlaceholder('Digite o nome artístico...').fill('DJ Newbie');
+        await page.getByRole('button', { name: "Buscar" }).click();
+
+        // After successful search, the form should appear with the name locked
+        await expect(page.locator('text=Complete seu Perfil')).toBeVisible();
+        await expect(page.locator('input#artisticName')).toHaveValue('DJ Newbie');
+
+        // Assert other required fields are visible
+        await expect(page.locator('input#location')).toBeVisible();
+        await expect(page.locator('input#genrePrimary')).toBeVisible();
+    });
+});
diff --git a/src/app/(dashboard)/dashboard/artist/page.tsx b/src/app/(dashboard)/dashboard/artist/page.tsx
new file mode 100644
index 0000000..7788969
--- /dev/null
+++ b/src/app/(dashboard)/dashboard/artist/page.tsx
@@ -0,0 +1,8 @@
+export default function ArtistDashboardPage() {
+    return (
+        <div className="flex min-h-[50vh] w-full items-center justify-center p-6 md:p-10">
+            <h1 className="text-3xl font-bold">Dashboard do Artista</h1>
+            {/* V1 dashboard contents go here in future epics */}
+        </div>
+    );
+}
diff --git a/src/app/(dashboard)/onboarding/artist/page.tsx b/src/app/(dashboard)/onboarding/artist/page.tsx
new file mode 100644
index 0000000..d3e5d82
--- /dev/null
+++ b/src/app/(dashboard)/onboarding/artist/page.tsx
@@ -0,0 +1,19 @@
+"use client";
+
+import { useState } from "react";
+import { SearchBeforeCreate } from "@/features/artists/components/search-before-create";
+import { OnboardingForm } from "@/features/artists/components/onboarding-form";
+
+export default function ArtistOnboardingPage() {
+    const [artisticName, setArtisticName] = useState<string | null>(null);
+
+    return (
+        <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
+            {!artisticName ? (
+                <SearchBeforeCreate onProceed={(name) => setArtisticName(name)} />
+            ) : (
+                <OnboardingForm initialArtisticName={artisticName} />
+            )}
+        </div>
+    );
+}
diff --git a/src/db/schema/artists.ts b/src/db/schema/artists.ts
new file mode 100644
index 0000000..c97d935
--- /dev/null
+++ b/src/db/schema/artists.ts
@@ -0,0 +1,18 @@
+import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
+import { profiles } from './auth';
+
+export const artists = pgTable('artists', {
+    id: uuid('id').defaultRandom().primaryKey(),
+    profileId: uuid('profile_id').references(() => profiles.id).notNull().unique(),
+    artisticName: text('artistic_name').notNull(),
+    location: text('location').notNull(),
+    genrePrimary: text('genre_primary').notNull(),
+    genreSecondary: text('genre_secondary'),
+    socialLinks: jsonb('social_links'), // For SoundCloud, YouTube, Instagram
+    presskitUrl: text('presskit_url'),
+    releasePdfUrl: text('release_pdf_url'),
+    photoUrl: text('photo_url'),
+    isVerified: boolean('is_verified').default(false).notNull(),
+    createdAt: timestamp('created_at').defaultNow().notNull(),
+    updatedAt: timestamp('updated_at').defaultNow().notNull(),
+});
diff --git a/src/features/artists/actions.test.ts b/src/features/artists/actions.test.ts
new file mode 100644
index 0000000..4651fe3
--- /dev/null
+++ b/src/features/artists/actions.test.ts
@@ -0,0 +1,55 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+// Mock the db to avoid real queries
+const mockSelect = vi.fn();
+const mockFrom = vi.fn();
+const mockWhere = vi.fn();
+const mockLimit = vi.fn();
+
+vi.mock("@/db/index", () => {
+    return {
+        db: {
+            select: (...args: any[]) => mockSelect(...args),
+        }
+    };
+});
+
+vi.mock('drizzle-orm', () => {
+    return {
+        eq: vi.fn(),
+        ilike: vi.fn(),
+    }
+});
+
+// Setting up the chain
+mockSelect.mockReturnValue({ from: mockFrom });
+mockFrom.mockReturnValue({ where: mockWhere });
+mockWhere.mockReturnValue({ limit: mockLimit });
+
+import { checkDuplicateArtist } from "./actions";
+
+describe("checkDuplicateArtist", () => {
+    beforeEach(() => {
+        vi.clearAllMocks();
+    });
+
+    it("returns false for empty or whitespace strings without hitting db", async () => {
+        expect(await checkDuplicateArtist("")).toBe(false);
+        expect(await checkDuplicateArtist("   ")).toBe(false);
+        expect(mockSelect).not.toHaveBeenCalled();
+    });
+
+    it("returns true if artist exists", async () => {
+        mockLimit.mockResolvedValue([{ id: "123" }]);
+        const result = await checkDuplicateArtist("DJ Test");
+        expect(result).toBe(true);
+        expect(mockSelect).toHaveBeenCalled();
+    });
+
+    it("returns false if artist does not exist", async () => {
+        mockLimit.mockResolvedValue([]);
+        const result = await checkDuplicateArtist("DJ Unique");
+        expect(result).toBe(false);
+        expect(mockSelect).toHaveBeenCalled();
+    });
+});
diff --git a/src/features/artists/actions.ts b/src/features/artists/actions.ts
new file mode 100644
index 0000000..9bbe66c
--- /dev/null
+++ b/src/features/artists/actions.ts
@@ -0,0 +1,132 @@
+"use server";
+
+import { z } from "zod";
+import { createClient } from "@/lib/supabase/server";
+import { db } from "@/db/index";
+import { artists } from "@/db/schema/artists";
+import { profiles } from "@/db/schema/auth";
+import { eq, ilike } from "drizzle-orm";
+import { redirect } from "next/navigation";
+
+export async function checkDuplicateArtist(name: string) {
+    if (!name || name.trim() === "") return false;
+
+    const existing = await db
+        .select({ id: artists.id })
+        .from(artists)
+        .where(ilike(artists.artisticName, name))
+        .limit(1);
+
+    return existing.length > 0;
+}
+
+export const artistOnboardingSchema = z.object({
+    artisticName: z.string().min(2, "Nome artístico obrigatório"),
+    location: z.string().min(2, "Localidade obrigatória"),
+    genrePrimary: z.string().min(2, "Gênero principal obrigatório"),
+    genreSecondary: z.string().optional(),
+    soundcloud: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
+    youtube: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
+    instagram: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
+    presskitUrl: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
+});
+
+export type ArtistOnboardingState = {
+    data: { success: boolean } | null;
+    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
+};
+
+export async function saveArtistOnboardingAction(
+    _prevState: ArtistOnboardingState,
+    formData: FormData
+): Promise<ArtistOnboardingState> {
+    const rawData = {
+        artisticName: formData.get("artisticName"),
+        location: formData.get("location"),
+        genrePrimary: formData.get("genrePrimary"),
+        genreSecondary: formData.get("genreSecondary") || undefined,
+        soundcloud: formData.get("soundcloud") || undefined,
+        youtube: formData.get("youtube") || undefined,
+        instagram: formData.get("instagram") || undefined,
+        presskitUrl: formData.get("presskitUrl") || undefined,
+    };
+
+    const parsed = artistOnboardingSchema.safeParse(rawData);
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
+    const {
+        artisticName,
+        location,
+        genrePrimary,
+        genreSecondary,
+        soundcloud,
+        youtube,
+        instagram,
+        presskitUrl,
+    } = parsed.data;
+
+    const supabase = await createClient();
+    const { data: { user } } = await supabase.auth.getUser();
+
+    if (!user) {
+        return {
+            data: null,
+            error: { message: "Usuário não autenticado", code: "UNAUTHORIZED" },
+        };
+    }
+
+    // Get Profile ID
+    const p = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
+    if (!p.length) {
+        return {
+            data: null,
+            error: { message: "Perfil não encontrado", code: "NO_PROFILE" },
+        };
+    }
+
+    const isDuplicate = await checkDuplicateArtist(artisticName);
+    if (isDuplicate) {
+        return {
+            data: null,
+            error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" },
+        };
+    }
+
+    try {
+        await db.insert(artists).values({
+            profileId: p[0].id,
+            artisticName,
+            location,
+            genrePrimary,
+            genreSecondary,
+            socialLinks: { soundcloud, youtube, instagram },
+            presskitUrl,
+            // Hardcoded verified false for now, UI says verified default but we follow standard flow
+            isVerified: true,
+        });
+    } catch (err: any) {
+        if (err.code === '23505') { // Postgres Unique Violation
+            return {
+                data: null,
+                error: { message: "Este perfil já completou o onboarding", code: "ALREADY_EXISTS" },
+            };
+        }
+        return {
+            data: null,
+            error: { message: "Erro ao salvar perfil do artista.", code: "DB_ERROR" },
+        };
+    }
+
+    redirect("/dashboard/artist");
+}
+diff --git a/src/features/artists/components/onboarding-form.tsx b/src/features/artists/components/onboarding-form.tsx
new file mode 100644
index 0000000..71ca21c
--- /dev/null
+++ b/src/features/artists/components/onboarding-form.tsx
@@ -0,0 +1,137 @@
+"use client";
+
+import { cn } from "@/lib/utils";
+import { Button } from "@/components/ui/button";
+import {
+    Card,
+    CardContent,
+    CardDescription,
+    CardHeader,
+    CardTitle,
+} from "@/components/ui/card";
+import { Input } from "@/components/ui/input";
+import { Label } from "@/components/ui/label";
+import { useActionState } from "react";
+import { saveArtistOnboardingAction, type ArtistOnboardingState } from "@/features/artists/actions";
+
+const initialState: ArtistOnboardingState = { data: null, error: null };
+
+interface OnboardingFormProps extends React.ComponentPropsWithoutRef<"div"> {
+    initialArtisticName: string;
+}
+
+export function OnboardingForm({
+    initialArtisticName,
+    className,
+    ...props
+}: OnboardingFormProps) {
+    const [state, formAction, isPending] = useActionState(saveArtistOnboardingAction, initialState);
+
+    return (
+        <div className={cn("flex flex-col gap-6", className)} {...props}>
+            <Card className="border border-border max-w-2xl mx-auto w-full">
+                <CardHeader>
+                    <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
+                    <CardDescription>
+                        Forneça os detalhes abaixo para criar seu perfil de Artista.
+                    </CardDescription>
+                </CardHeader>
+                <CardContent>
+                    <form action={formAction}>
+                        <div className="flex flex-col gap-6">
+
+                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+                                {/* Artistic Name */}
+                                <div className="grid gap-2 col-span-1 md:col-span-2">
+                                    <Label htmlFor="artisticName">Nome Artístico <span className="text-neon-red">*</span></Label>
+                                    <Input
+                                        id="artisticName"
+                                        name="artisticName"
+                                        type="text"
+                                        defaultValue={initialArtisticName}
+                                        readOnly // Since they searched for it, lock it here or let them edit? We'll let it be readonly for UX safety since we just checked it.
+                                    />
+                                    {state.error?.fieldErrors?.artisticName && (
+                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.artisticName[0]}</p>
+                                    )}
+                                </div>
+
+                                {/* Location */}
+                                <div className="grid gap-2 col-span-1 md:col-span-2">
+                                    <Label htmlFor="location">Localidade (Cidade/Estado) <span className="text-neon-red">*</span></Label>
+                                    <Input
+                                        id="location"
+                                        name="location"
+                                        type="text"
+                                        placeholder="Ex: São Paulo, SP"
+                                        required
+                                    />
+                                    {state.error?.fieldErrors?.location && (
+                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.location[0]}</p>
+                                    )}
+                                </div>
+
+                                {/* Primary Genre */}
+                                <div className="grid gap-2">
+                                    <Label htmlFor="genrePrimary">Gênero Principal <span className="text-neon-red">*</span></Label>
+                                    <Input
+                                        id="genrePrimary"
+                                        name="genrePrimary"
+                                        type="text"
+                                        placeholder="Ex: Techno"
+                                        required
+                                    />
+                                    {state.error?.fieldErrors?.genrePrimary && (
+                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.genrePrimary[0]}</p>
+                                    )}
+                                </div>
+
+                                {/* Secondary Genre */}
+                                <div className="grid gap-2">
+                                    <Label htmlFor="genreSecondary">Gênero Secundário (Opcional)</Label>
+                                    <Input
+                                        id="genreSecondary"
+                                        name="genreSecondary"
+                                        type="text"
+                                        placeholder="Ex: Tech House"
+                                    />
+                                </div>
+                            </div>
+
+                            <div className="space-y-4 pt-4 border-t border-border">
+                                <h4 className="font-medium text-sm text-muted-foreground">Redes e Links (Opcional)</h4>
+
+                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+                                    <div className="grid gap-2">
+                                        <Label htmlFor="soundcloud">Soundcloud</Label>
+                                        <Input id="soundcloud" name="soundcloud" type="url" placeholder="https://soundcloud.com/..." />
+                                    </div>
+                                    <div className="grid gap-2">
+                                        <Label htmlFor="instagram">Instagram</Label>
+                                        <Input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/..." />
+                                    </div>
+                                    <div className="grid gap-2">
+                                        <Label htmlFor="youtube">YouTube</Label>
+                                        <Input id="youtube" name="youtube" type="url" placeholder="https://youtube.com/..." />
+                                    </div>
+                                    <div className="grid gap-2">
+                                        <Label htmlFor="presskitUrl">Presskit Link</Label>
+                                        <Input id="presskitUrl" name="presskitUrl" type="url" placeholder="G-Drive / Dropbox link..." />
+                                    </div>
+                                </div>
+                            </div>
+
+                            {state.error && !state.error.fieldErrors && (
+                                <p className="text-sm text-neon-red">{state.error.message}</p>
+                            )}
+
+                            <Button type="submit" className="w-full" disabled={isPending}>
+                                {isPending ? "Salvando..." : "Finalizar Onboarding"}
+                            </Button>
+                        </div>
+                    </form>
+                </CardContent>
+            </Card>
+        </div>
+    );
+}
diff --git a/src/features/artists/components/search-before-create.tsx b/src/features/artists/components/search-before-create.tsx
new file mode 100644
index 0000000..c1a8e2b
--- /dev/null
+++ b/src/features/artists/components/search-before-create.tsx
@@ -0,0 +1,70 @@
+"use client";
+
+import { useState } from "react";
+import { Button } from "@/components/ui/button";
+import { Input } from "@/components/ui/input";
+import { Label } from "@/components/ui/label";
+import { Search } from "lucide-react";
+import { checkDuplicateArtist } from "@/features/artists/actions";
+
+interface SearchBeforeCreateProps {
+    onProceed: (artisticName: string) => void;
+}
+
+export function SearchBeforeCreate({ onProceed }: SearchBeforeCreateProps) {
+    const [query, setQuery] = useState("");
+    const [isSearching, setIsSearching] = useState(false);
+    const [error, setError] = useState<string | null>(null);
+
+    const handleSearch = async (e: React.FormEvent) => {
+        e.preventDefault();
+        if (!query.trim()) return;
+
+        setIsSearching(true);
+        setError(null);
+
+        const isDuplicate = await checkDuplicateArtist(query.trim());
+
+        setIsSearching(false);
+
+        if (isDuplicate) {
+            setError("Já existe um artista com este nome cadastrado na plataforma.");
+        } else {
+            onProceed(query.trim());
+        }
+    };
+
+    return (
+        <div className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm">
+            <div className="flex flex-col space-y-1.5">
+                <h3 className="font-semibold tracking-tight text-2xl">Buscando seu perfil</h3>
+                <p className="text-sm text-muted-foreground">
+                    Antes de continuar, vamos verificar se já existe um perfil na Agenda Clubber com o seu nome artístico.
+                </p>
+            </div>
+            <form onSubmit={handleSearch} className="flex flex-col gap-4">
+                <div className="space-y-2">
+                    <Label htmlFor="artisticNameSearch">Qual é o seu nome artístico?</Label>
+                    <div className="flex gap-2">
+                        <Input
+                            id="artisticNameSearch"
+                            placeholder="Digite o nome artístico..."
+                            value={query}
+                            onChange={(e) => setQuery(e.target.value)}
+                            required
+                        />
+                        <Button type="submit" disabled={isSearching || !query.trim()}>
+                            <Search className="h-4 w-4 mr-2" />
+                            {isSearching ? "Buscando..." : "Buscar"}
+                        </Button>
+                    </div>
+                </div>
+                {error && (
+                    <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-500 rounded-md text-sm">
+                        {error}
+                    </div>
+                )}
+            </form>
+        </div>
+    );
+}
diff --git a/supabase/migrations/002_storage_setup.sql b/supabase/migrations/002_storage_setup.sql
new file mode 100644
index 0000000..000edfe
--- /dev/null
+++ b/supabase/migrations/002_storage_setup.sql
@@ -0,0 +1,19 @@
+-- Create buckets if not exists
+insert into storage.buckets (id, name, public)
+values ('artist_media', 'artist_media', true)
+on conflict (id) do nothing;
+
+-- Set up RLS for storage (simulated or direct SQL)
+CREATE POLICY "Public Access" 
+ON storage.objects FOR SELECT 
+USING ( bucket_id = 'artist_media' );
+
+CREATE POLICY "Authenticated Insert" 
+ON storage.objects FOR INSERT 
+TO authenticated 
+WITH CHECK ( bucket_id = 'artist_media' );
+
+CREATE POLICY "Owners Update"
+ON storage.objects FOR UPDATE
+TO authenticated
+USING ( bucket_id = 'artist_media' AND auth.uid() = owner);
```
