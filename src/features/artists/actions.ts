"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { artists } from "@/db/schema/artists";
import { profiles } from "@/db/schema/auth";
import { collectiveMembers } from "@/db/schema/collective-members";
import { and, eq, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";
import { artistOnboardingSchema, createOnTheFlyArtistSchema, fileSchema } from "./schemas";
import { enqueueArtistClaimInvitation } from "@/features/notifications/qstash";

export async function checkDuplicateArtist(name: string) {
    if (!name || name.trim() === "") return false;

    try {
        const existing = await db
            .select({ id: artists.id })
            .from(artists)
            .where(ilike(artists.artisticName, name))
            .limit(1);
        return existing.length > 0;
    } catch {
        return false;
    }
}

export type ArtistOnboardingState = {
    data: { success: boolean } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

async function validateMagicBytes(file: File, type: "image" | "pdf"): Promise<boolean> {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (type === "pdf") {
        return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    }
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    return isJpeg || isPng;
}

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

    // Validate magic bytes to prevent MIME type spoofing
    if (fileParsed.data.photo) {
        const valid = await validateMagicBytes(fileParsed.data.photo, "image");
        if (!valid) {
            return {
                data: null,
                error: {
                    message: "Arquivo de foto inválido",
                    code: "VALIDATION_ERROR",
                    fieldErrors: { photo: ["Formato de imagem inválido. Use um JPEG ou PNG real."] },
                },
            };
        }
    }

    if (fileParsed.data.releasePdf) {
        const valid = await validateMagicBytes(fileParsed.data.releasePdf, "pdf");
        if (!valid) {
            return {
                data: null,
                error: {
                    message: "Arquivo PDF inválido",
                    code: "VALIDATION_ERROR",
                    fieldErrors: { releasePdf: ["Arquivo não é um PDF válido."] },
                },
            };
        }
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            data: null,
            error: { message: "Usuário não autenticado", code: "UNAUTHORIZED" },
        };
    }

    // Get Profile ID
    let profileResult: { id: string }[];
    try {
        profileResult = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    } catch {
        return {
            data: null,
            error: { message: "Erro ao buscar perfil", code: "DB_ERROR" },
        };
    }

    if (!profileResult.length) {
        return {
            data: null,
            error: { message: "Perfil não encontrado", code: "NO_PROFILE" },
        };
    }

    const profileId = profileResult[0].id;

    // Check duplicate BEFORE uploading files to avoid orphaned storage objects
    const isDuplicate = await checkDuplicateArtist(artisticName);
    if (isDuplicate) {
        return {
            data: null,
            error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" },
        };
    }

    // Upload files and track paths for rollback on DB failure
    const uploadedPaths: string[] = [];
    let photoUrl: string | undefined;
    let releasePdfUrl: string | undefined;

    if (fileParsed.data.photo) {
        const f = fileParsed.data.photo;
        const ext = f.type === "image/png" ? "png" : "jpg";
        const path = `${profileId}/photo.${ext}`;
        // Use hardcoded contentType derived from magic-byte-validated ext, not client-supplied f.type
        const contentType = ext === "png" ? "image/png" : "image/jpeg";
        const { error: uploadError } = await supabase.storage
            .from("artist_media").upload(path, f, { upsert: true, contentType });
        if (uploadError) return { data: null, error: { message: "Erro ao enviar foto", code: "UPLOAD_ERROR" } };
        uploadedPaths.push(path);
        photoUrl = supabase.storage.from("artist_media").getPublicUrl(path).data.publicUrl;
    }

    if (fileParsed.data.releasePdf) {
        const f = fileParsed.data.releasePdf;
        const path = `${profileId}/release.pdf`;
        const { error: uploadError } = await supabase.storage
            .from("artist_media").upload(path, f, { upsert: true, contentType: "application/pdf" });
        if (uploadError) return { data: null, error: { message: "Erro ao enviar Release PDF", code: "UPLOAD_ERROR" } };
        uploadedPaths.push(path);
        releasePdfUrl = supabase.storage.from("artist_media").getPublicUrl(path).data.publicUrl;
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
    } catch (err: unknown) {
        // Rollback: remove uploaded files to avoid orphaned storage objects
        if (uploadedPaths.length > 0) {
            await supabase.storage.from("artist_media").remove(uploadedPaths);
        }
        if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
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

export type CreateOnTheFlyArtistState = {
    data: { success: boolean; artistId: string; emailQueued: boolean } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function createOnTheFlyArtistAction(
    _prevState: CreateOnTheFlyArtistState,
    formData: FormData
): Promise<CreateOnTheFlyArtistState> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { data: null, error: { message: "Usuário não autenticado", code: "UNAUTHORIZED" } };
    }

    const adminCheck = await db
        .select({ id: collectiveMembers.id })
        .from(collectiveMembers)
        .innerJoin(profiles, eq(profiles.id, collectiveMembers.profileId))
        .where(and(eq(profiles.userId, user.id), eq(collectiveMembers.role, "collective_admin")))
        .limit(1);

    if (!adminCheck.length) {
        return { data: null, error: { message: "Apenas admins de coletivo podem criar artistas", code: "FORBIDDEN" } };
    }

    const rawData = {
        artisticName: formData.get("artisticName"),
        location: formData.get("location"),
        email: formData.get("email") || undefined,
    };

    const parsed = createOnTheFlyArtistSchema.safeParse(rawData);
    if (!parsed.success) {
        return {
            data: null,
            error: {
                message: "Dados inválidos. Corrija os campos abaixo.",
                code: "VALIDATION_ERROR",
                fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
            },
        };
    }

    const { artisticName, location, email } = parsed.data;
    const normalizedEmail = email === "" ? undefined : email;

    const isDuplicate = await checkDuplicateArtist(artisticName);
    if (isDuplicate) {
        return { data: null, error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" } };
    }

    let artistId: string;
    try {
        const [inserted] = await db.insert(artists).values({
            profileId: null,
            artisticName,
            location,
            genrePrimary: null,
            isVerified: false,
        }).returning({ id: artists.id });
        artistId = inserted.id;
    } catch (err: unknown) {
        if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
            return { data: null, error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" } };
        }
        return { data: null, error: { message: "Erro ao criar perfil do artista", code: "DB_ERROR" } };
    }

    let emailQueued = false;
    if (normalizedEmail) {
        const result = await enqueueArtistClaimInvitation({ artistId, email: normalizedEmail, artisticName });
        if (result.queued) {
            emailQueued = true;
        } else {
            console.error("[createOnTheFlyArtistAction] enqueue falhou:", result.error);
        }
    }

    return { data: { success: true, artistId, emailQueued }, error: null };
}
