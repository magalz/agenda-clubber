"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { collectives } from "@/db/schema/collectives";
import { collectiveMembers } from "@/db/schema/collective-members";
import { profiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const createCollectiveSchema = z.object({
    name: z.string().min(2, "Nome do coletivo é obrigatório"),
    location: z.string().min(2, "Localidade obrigatória"),
    genrePrimary: z.string().min(2, "Gênero principal obrigatório"),
    genreSecondary: z.string().optional(),
    description: z.string().optional(),
    youtube: z.union([z.literal(""), z.string().url("URL inválida")]).optional(),
    soundcloud: z.union([z.literal(""), z.string().url("URL inválida")]).optional(),
    instagram: z.union([z.literal(""), z.string().url("URL inválida")]).optional(),
});

export type CreateCollectiveState = {
    data: { success: boolean; collectiveId?: string } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function createCollectiveAction(
    _prevState: CreateCollectiveState,
    formData: FormData
): Promise<CreateCollectiveState> {
    const rawData = {
        name: formData.get("name"),
        location: formData.get("location"),
        genrePrimary: formData.get("genrePrimary"),
        genreSecondary: formData.get("genreSecondary") || undefined,
        description: formData.get("description") || undefined,
        youtube: formData.get("youtube") || undefined,
        soundcloud: formData.get("soundcloud") || undefined,
        instagram: formData.get("instagram") || undefined,
    };

    const parsed = createCollectiveSchema.safeParse(rawData);

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
        return {
            data: null,
            error: {
                message: "Dados inválidos. Corrija os campos abaixo.",
                code: "VALIDATION_ERROR",
                fieldErrors,
            },
        };
    }

    const {
        name,
        location,
        genrePrimary,
        genreSecondary,
        description,
        youtube,
        soundcloud,
        instagram,
    } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: "Não autorizado", code: "UNAUTHORIZED" } };
    }

    const p = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);

    if (!p.length) {
        return { data: null, error: { message: "Perfil não encontrado", code: "NO_PROFILE" } };
    }

    try {
        const [newCollective] = await db.insert(collectives).values({
            name,
            location,
            genrePrimary,
            genreSecondary,
            description,
            socialLinks: { youtube, soundcloud, instagram },
            ownerId: p[0].id,
            status: "pending",
        }).returning({ id: collectives.id });

        await db.insert(collectiveMembers).values({
            collectiveId: newCollective.id,
            profileId: p[0].id,
            role: "admin",
        });

    } catch (err) {
        return {
            data: null,
            error: { message: "Erro ao criar o coletivo.", code: "DB_ERROR" },
        };
    }

    redirect("/dashboard/collective");
}
