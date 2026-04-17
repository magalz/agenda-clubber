"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { collectives } from "@/db/schema/collectives";
import { collectiveMembers } from "@/db/schema/collective-members";
import { profiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const httpsUrl = z.union([
    z.literal(""),
    z.string()
        .url("URL inválida")
        .refine((u) => u.startsWith("https://") || u.startsWith("http://"), "Apenas URLs http/https são permitidas"),
]).optional();

export const createCollectiveSchema = z.object({
    name: z.string().min(2, "Nome do coletivo é obrigatório"),
    location: z.string().min(2, "Localidade obrigatória"),
    genrePrimary: z.string().min(2, "Gênero principal obrigatório"),
    genreSecondary: z.string().optional(),
    description: z.string().optional(),
    youtube: httpsUrl,
    soundcloud: httpsUrl,
    instagram: httpsUrl,
});

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

const logoSchema = z.instanceof(File)
    .refine((f) => f.size <= MAX_LOGO_SIZE, "Logo deve ter no máximo 5MB")
    .refine((f) => ["image/jpeg", "image/png"].includes(f.type), "Use JPEG ou PNG")
    .nullable();

export type CreateCollectiveState = {
    data: { success: boolean; collectiveId?: string } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

async function validateMagicBytes(file: File): Promise<boolean> {
    const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    return isJpeg || isPng;
}

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

    const { name, location, genrePrimary, genreSecondary, description, youtube, soundcloud, instagram } = parsed.data;

    // Validate logo file if provided
    const logoRaw = formData.get("logo");
    const logo = (logoRaw instanceof File && logoRaw.size > 0) ? logoRaw : null;

    const logoParsed = logoSchema.safeParse(logo);
    if (!logoParsed.success) {
        return {
            data: null,
            error: {
                message: "Arquivo inválido",
                code: "VALIDATION_ERROR",
                fieldErrors: logoParsed.error.flatten().fieldErrors as Record<string, string[]>,
            },
        };
    }

    if (logoParsed.data) {
        const valid = await validateMagicBytes(logoParsed.data);
        if (!valid) {
            return {
                data: null,
                error: {
                    message: "Arquivo de logo inválido",
                    code: "VALIDATION_ERROR",
                    fieldErrors: { logo: ["Formato de imagem inválido. Use um JPEG ou PNG real."] },
                },
            };
        }
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { data: null, error: { message: "Não autorizado", code: "UNAUTHORIZED" } };
    }

    let profileResult: { id: string }[];
    try {
        profileResult = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    } catch {
        return { data: null, error: { message: "Erro ao buscar perfil", code: "DB_ERROR" } };
    }

    if (!profileResult.length) {
        return { data: null, error: { message: "Perfil não encontrado", code: "NO_PROFILE" } };
    }

    const profileId = profileResult[0].id;

    // Upload logo before DB insert
    let logoUrl: string | undefined;
    if (logoParsed.data) {
        const f = logoParsed.data;
        const ext = f.type === "image/png" ? "png" : "jpg";
        const contentType = ext === "png" ? "image/png" : "image/jpeg";
        const path = `${profileId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from("collective_media").upload(path, f, { upsert: true, contentType });
        if (uploadError) {
            return { data: null, error: { message: "Erro ao enviar logo", code: "UPLOAD_ERROR" } };
        }
        logoUrl = supabase.storage.from("collective_media").getPublicUrl(path).data.publicUrl;
    }

    try {
        await db.transaction(async (tx) => {
            const [newCollective] = await tx.insert(collectives).values({
                name,
                location,
                genrePrimary,
                genreSecondary,
                description,
                logoUrl,
                socialLinks: { youtube, soundcloud, instagram },
                ownerId: profileId,
                status: "pending_approval",
            }).returning({ id: collectives.id });

            await tx.insert(collectiveMembers).values({
                collectiveId: newCollective.id,
                profileId,
                role: "collective_admin",
            });
        });
    } catch (err) {
        console.error("[createCollectiveAction] DB error:", err);
        // Rollback logo upload if DB transaction failed
        if (logoUrl) {
            const ext = logoParsed.data!.type === "image/png" ? "png" : "jpg";
            await supabase.storage.from("collective_media").remove([`${profileId}/logo.${ext}`]);
        }
        return {
            data: null,
            error: { message: "Erro ao criar o coletivo.", code: "DB_ERROR" },
        };
    }

    redirect("/dashboard/collective");
}
