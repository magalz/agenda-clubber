"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { artists } from "@/db/schema/artists";
import { profiles } from "@/db/schema/auth";
import { collectiveMembers } from "@/db/schema/collective-members";
import { and, eq, ilike, isNull, not } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
    artistOnboardingSchema,
    artistClaimSchema,
    createOnTheFlyArtistSchema,
    fileSchema,
    trimmedStr,
} from "./schemas";
import { validateMagicBytes } from "./validators";
import { DEFAULT_PRIVACY_SETTINGS } from "./types";
import { uniqueSlug } from "./slug";
import { enqueueArtistClaimInvitation } from "@/features/notifications/qstash";
import { escapeLikePattern } from "@/lib/db/like-pattern";

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
        bio: formData.get("bio") || undefined,
        privacySettings: formData.get("privacySettings") || undefined,
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
        bio,
        privacySettings,
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

    const isDuplicate = await checkDuplicateArtist(artisticName);
    if (isDuplicate) {
        return {
            data: null,
            error: { message: "Já existe um artista com este nome", code: "DUPLICATE_NAME" },
        };
    }

    const slug = await uniqueSlug(artisticName, async (s) => {
        const hit = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, s)).limit(1);
        return hit.length > 0;
    });

    const uploadedPaths: string[] = [];
    let photoUrl: string | undefined;
    let releasePdfUrl: string | undefined;

    if (fileParsed.data.photo) {
        const f = fileParsed.data.photo;
        const ext = f.type === "image/png" ? "png" : "jpg";
        const path = `${profileId}/photo.${ext}`;
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
            slug,
            location,
            genrePrimary,
            genreSecondary,
            bio: bio || null,
            socialLinks: Object.fromEntries(
                Object.entries({ soundcloud, youtube, instagram })
                    .filter(([, v]) => v !== undefined && v !== "")
            ),
            presskitUrl: presskitUrl || undefined,
            photoUrl,
            releasePdfUrl,
            isVerified: false,
            status: 'pending_approval',
            privacySettings: privacySettings ?? DEFAULT_PRIVACY_SETTINGS,
        });
    } catch (err: unknown) {
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

    const slug = await uniqueSlug(artisticName, async (s) => {
        const hit = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, s)).limit(1);
        return hit.length > 0;
    });

    let artistId: string;
    try {
        const [inserted] = await db.insert(artists).values({
            profileId: null,
            artisticName,
            slug,
            location,
            genrePrimary: null,
            isVerified: false,
            // on-the-fly artists are created by collective admins and must be immediately visible
            status: 'approved',
            privacySettings: DEFAULT_PRIVACY_SETTINGS,
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

// ─── T3: searchRestrictedArtistByName ────────────────────────────────────────

export type RestrictedArtistHit = {
    id: string;
    artisticName: string;
    location: string;
    genrePrimary: string | null;
    photoUrl: string | null;
};

export type SearchRestrictedArtistResult = {
    data: { hit: RestrictedArtistHit | null; conflict: boolean } | null;
    error: { message: string; code: 'VALIDATION_ERROR' | 'DB_ERROR' } | null;
};

export async function searchRestrictedArtistByName(name: string): Promise<SearchRestrictedArtistResult> {
    const nameSchema = trimmedStr(2, 100, "Nome artístico deve ter pelo menos 2 caracteres");
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
        return {
            data: null,
            error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' },
        };
    }

    const trimmedName = parsed.data;
    const escapedName = escapeLikePattern(trimmedName);

    try {
        // Single query: get restricted hit (profile_id IS NULL, status='approved')
        // and detect conflict (same name but profile_id != NULL) simultaneously
        const [restrictedHit, conflictCheck] = await Promise.all([
            db
                .select({
                    id: artists.id,
                    artisticName: artists.artisticName,
                    location: artists.location,
                    genrePrimary: artists.genrePrimary,
                    photoUrl: artists.photoUrl,
                })
                .from(artists)
                .where(and(
                    ilike(artists.artisticName, escapedName),
                    isNull(artists.profileId),
                    eq(artists.status, 'approved')
                ))
                .limit(1),
            db
                .select({ id: artists.id })
                .from(artists)
                .where(and(
                    ilike(artists.artisticName, escapedName),
                    not(isNull(artists.profileId))
                ))
                .limit(1),
        ]);

        return {
            data: {
                hit: restrictedHit[0] ?? null,
                conflict: conflictCheck.length > 0,
            },
            error: null,
        };
    } catch {
        return { data: null, error: { message: "Erro ao buscar artistas", code: 'DB_ERROR' } };
    }
}

// ─── T4: claimArtistProfileAction ────────────────────────────────────────────

export type ClaimArtistState = {
    data: { success: true } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function claimArtistProfileAction(
    artistId: string,
    _prevState: ClaimArtistState,
    formData: FormData
): Promise<ClaimArtistState> {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { data: null, error: { message: "Usuário não autenticado", code: "UNAUTHORIZED" } };
    }

    // 2. Get profile
    let profileRow: { id: string; role: string }[];
    try {
        profileRow = await db
            .select({ id: profiles.id, role: profiles.role })
            .from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1);
    } catch {
        return { data: null, error: { message: "Erro ao buscar perfil", code: "DB_ERROR" } };
    }

    if (!profileRow.length) {
        return { data: null, error: { message: "Perfil não encontrado", code: "NO_PROFILE" } };
    }

    const { id: profileId, role } = profileRow[0];

    // 3. Role check — only artists can claim profiles
    if (role !== 'artista') {
        return { data: null, error: { message: "Apenas artistas podem reivindicar perfis", code: "FORBIDDEN" } };
    }

    // 4. Validate form data (without artisticName/location — comes from the existing record)
    const rawData = {
        genrePrimary: formData.get("genrePrimary"),
        genreSecondary: formData.get("genreSecondary") || undefined,
        soundcloud: formData.get("soundcloud") || undefined,
        youtube: formData.get("youtube") || undefined,
        instagram: formData.get("instagram") || undefined,
        presskitUrl: formData.get("presskitUrl") || undefined,
        bio: formData.get("bio") || undefined,
        privacySettings: formData.get("privacySettings") || undefined,
    };

    const parsed = artistClaimSchema.safeParse(rawData);
    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
        return {
            data: null,
            error: { message: "Dados inválidos. Corrija os campos abaixo.", code: "VALIDATION_ERROR", fieldErrors },
        };
    }

    const { genrePrimary, genreSecondary, soundcloud, youtube, instagram, presskitUrl, bio, privacySettings } = parsed.data;

    // 5. Validate uploaded files
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

    if (fileParsed.data.photo) {
        const valid = await validateMagicBytes(fileParsed.data.photo, "image");
        if (!valid) {
            return {
                data: null,
                error: { message: "Arquivo de foto inválido", code: "VALIDATION_ERROR", fieldErrors: { photo: ["Formato de imagem inválido. Use um JPEG ou PNG real."] } },
            };
        }
    }

    if (fileParsed.data.releasePdf) {
        const valid = await validateMagicBytes(fileParsed.data.releasePdf, "pdf");
        if (!valid) {
            return {
                data: null,
                error: { message: "Arquivo PDF inválido", code: "VALIDATION_ERROR", fieldErrors: { releasePdf: ["Arquivo não é um PDF válido."] } },
            };
        }
    }

    // 6. Defensive query: verify artist exists and is claimable
    let artistRow: { id: string; profileId: string | null; status: string }[];
    try {
        artistRow = await db
            .select({ id: artists.id, profileId: artists.profileId, status: artists.status })
            .from(artists)
            .where(eq(artists.id, artistId))
            .limit(1);
    } catch {
        return { data: null, error: { message: "Erro ao verificar artista", code: "DB_ERROR" } };
    }

    if (!artistRow.length) {
        return { data: null, error: { message: "Perfil não encontrado", code: "NOT_FOUND" } };
    }

    if (artistRow[0].profileId !== null) {
        return { data: null, error: { message: "Este perfil já foi reivindicado", code: "ALREADY_CLAIMED" } };
    }

    if (artistRow[0].status !== 'approved') {
        return { data: null, error: { message: "Perfil não está disponível para claim", code: "NOT_CLAIMABLE" } };
    }

    // 7a. Pre-upload check: ensure this profile doesn't already own another artist record.
    // This avoids uploading files only to hit the 23505 unique constraint on profile_id.
    try {
        const existing = await db
            .select({ id: artists.id })
            .from(artists)
            .where(eq(artists.profileId, profileId))
            .limit(1);
        if (existing.length > 0) {
            return { data: null, error: { message: "Você já possui um perfil de artista", code: "ALREADY_HAS_ARTIST" } };
        }
    } catch {
        return { data: null, error: { message: "Erro ao verificar artista existente", code: "DB_ERROR" } };
    }

    // 7b. Upload files
    const uploadedPaths: string[] = [];
    let photoUrl: string | undefined;
    let releasePdfUrl: string | undefined;

    if (fileParsed.data.photo) {
        const f = fileParsed.data.photo;
        const ext = f.type === "image/png" ? "png" : "jpg";
        const path = `${profileId}/photo.${ext}`;
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

    // 8. Atomic update — WHERE profile_id IS NULL prevents race condition
    try {
        const updated = await db
            .update(artists)
            .set({
                profileId,
                bio: bio || null,
                socialLinks: Object.fromEntries(
                    Object.entries({ soundcloud, youtube, instagram })
                        .filter(([, v]) => v !== undefined && v !== "")
                ),
                presskitUrl: presskitUrl || null,
                photoUrl: photoUrl ?? null,
                releasePdfUrl: releasePdfUrl ?? null,
                genrePrimary: genrePrimary ?? null,
                genreSecondary: genreSecondary ?? null,
                privacySettings: privacySettings ?? DEFAULT_PRIVACY_SETTINGS,
                status: 'pending_approval',
                updatedAt: new Date(),
            })
            .where(and(eq(artists.id, artistId), isNull(artists.profileId)))
            .returning({ id: artists.id });

        // empty result means another claim completed concurrently.
        if (updated.length === 0) {
            if (uploadedPaths.length > 0) {
                await supabase.storage.from("artist_media").remove(uploadedPaths);
            }
            return { data: null, error: { message: "Este perfil já foi reivindicado", code: "ALREADY_CLAIMED" } };
        }
    } catch (err: unknown) {
        if (uploadedPaths.length > 0) {
            await supabase.storage.from("artist_media").remove(uploadedPaths);
        }
        if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
            return { data: null, error: { message: "Você já possui um perfil de artista", code: "ALREADY_HAS_ARTIST" } };
        }
        return { data: null, error: { message: "Erro ao reivindicar perfil", code: "DB_ERROR" } };
    }

    redirect("/dashboard/artist");
}
