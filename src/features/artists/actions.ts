"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { artists } from "@/db/schema/artists";
import { profiles } from "@/db/schema/auth";
import { eq, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function checkDuplicateArtist(name: string) {
    if (!name || name.trim() === "") return false;

    const existing = await db
        .select({ id: artists.id })
        .from(artists)
        .where(ilike(artists.artisticName, name))
        .limit(1);

    return existing.length > 0;
}

const trimmedStr = (min: number, max: number, minMsg: string) =>
    z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(min, minMsg).max(max, `Máximo de ${max} caracteres`)
    );

export const artistOnboardingSchema = z.object({
    artisticName: trimmedStr(2, 100, "Nome artístico obrigatório"),
    location: trimmedStr(2, 100, "Localidade obrigatória"),
    genrePrimary: trimmedStr(2, 50, "Gênero principal obrigatório"),
    genreSecondary: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().max(50, "Máximo de 50 caracteres").optional()
    ),
    soundcloud: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
    youtube: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
    instagram: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
    presskitUrl: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
});

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024;  // 20MB

const fileSchema = z.object({
    photo: z.instanceof(File)
        .refine((f) => f.size <= MAX_PHOTO_SIZE, "Foto deve ter no máximo 5MB")
        .refine((f) => ["image/jpeg", "image/png"].includes(f.type), "Use JPEG ou PNG")
        .nullable(),
    releasePdf: z.instanceof(File)
        .refine((f) => f.size <= MAX_PDF_SIZE, "PDF deve ter no máximo 20MB")
        .refine((f) => f.type === "application/pdf", "Apenas arquivos PDF são aceitos")
        .nullable(),
});

export { fileSchema };

export type ArtistOnboardingState = {
    data: { success: boolean } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function saveArtistOnboardingAction(
    _prevState: ArtistOnboardingState,
    formData: FormData
): Promise<ArtistOnboardingState> {
    const rawData = {
        artisticName: formData.get("artisticName"),
        location: formData.get("location"),
        genrePrimary: formData.get("genrePrimary"),
        genreSecondary: formData.get("genreSecondary") || undefined,
        soundcloud: formData.get("soundcloud") || undefined,
        youtube: formData.get("youtube") || undefined,
        instagram: formData.get("instagram") || undefined,
        presskitUrl: formData.get("presskitUrl") || undefined,
    };

    const parsed = artistOnboardingSchema.safeParse(rawData);

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
        artisticName,
        location,
        genrePrimary,
        genreSecondary,
        soundcloud,
        youtube,
        instagram,
        presskitUrl,
    } = parsed.data;

    // Extract files (File with size=0 means no file selected)
    const photoRaw = formData.get("photo");
    const photo = (photoRaw instanceof File && photoRaw.size > 0) ? photoRaw : null;

    const pdfRaw = formData.get("releasePdf");
    const releasePdf = (pdfRaw instanceof File && pdfRaw.size > 0) ? pdfRaw : null;

    const fileParsed = fileSchema.safeParse({ photo, releasePdf });
    if (!fileParsed.success) {
        return {
            data: null,
            error: {
                message: "Arquivo inválido",
                code: "VALIDATION_ERROR",
                fieldErrors: fileParsed.error.flatten().fieldErrors as Record<string, string[]>,
            },
        };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            data: null,
            error: { message: "Usuário não autenticado", code: "UNAUTHORIZED" },
        };
    }

    // Get Profile ID
    const p = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    if (!p.length) {
        return {
            data: null,
            error: { message: "Perfil não encontrado", code: "NO_PROFILE" },
        };
    }

    const profileId = p[0].id;

    const isDuplicate = await checkDuplicateArtist(artisticName);
    if (isDuplicate) {
        return {
            data: null,
            error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" },
        };
    }

    // Upload files before insert
    let photoUrl: string | undefined;
    let releasePdfUrl: string | undefined;

    if (fileParsed.data.photo) {
        const f = fileParsed.data.photo;
        const ext = f.type === "image/png" ? "png" : "jpg";
        const path = `${profileId}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from('artist_media').upload(path, f, { upsert: true, contentType: f.type });
        if (uploadError) return { data: null, error: { message: "Erro ao enviar foto", code: "UPLOAD_ERROR" } };
        photoUrl = supabase.storage.from('artist_media').getPublicUrl(path).data.publicUrl;
    }

    if (fileParsed.data.releasePdf) {
        const f = fileParsed.data.releasePdf;
        const path = `${profileId}/release.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('artist_media').upload(path, f, { upsert: true, contentType: 'application/pdf' });
        if (uploadError) return { data: null, error: { message: "Erro ao enviar Release PDF", code: "UPLOAD_ERROR" } };
        releasePdfUrl = supabase.storage.from('artist_media').getPublicUrl(path).data.publicUrl;
    }

    try {
        await db.insert(artists).values({
            profileId,
            artisticName,
            location,
            genrePrimary,
            genreSecondary,
            socialLinks: Object.fromEntries(
                Object.entries({ soundcloud, youtube, instagram })
                    .filter(([, v]) => v !== undefined && v !== "")
            ),
            presskitUrl: presskitUrl || undefined,
            photoUrl,
            releasePdfUrl,
            isVerified: false,
        });
    } catch (err: any) {
        if (err.code === '23505') { // Postgres Unique Violation
            return {
                data: null,
                error: { message: "Este perfil já completou o onboarding", code: "ALREADY_EXISTS" },
            };
        }
        return {
            data: null,
            error: { message: "Erro ao salvar perfil do artista.", code: "DB_ERROR" },
        };
    }

    redirect("/dashboard/artist");
}
