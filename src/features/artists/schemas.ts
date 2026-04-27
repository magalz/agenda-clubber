import { z } from "zod";
import { DEFAULT_PRIVACY_SETTINGS, privacySettingsFromMode } from "./types";

const trimmedStr = (min: number, max: number, minMsg: string) =>
    z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(min, minMsg).max(max, `Máximo de ${max} caracteres`)
    );

const privacyModeSchema = z.enum(['public', 'collectives_only', 'private', 'ghost']);

const privacySettingsSchema = z.preprocess(
    (v) => {
        if (typeof v === 'string') {
            try { return JSON.parse(v); } catch { return v; }
        }
        return v;
    },
    z.object({
        mode: privacyModeSchema,
        fields: z.object({
            social_links: z.enum(['public', 'collectives_only', 'private']),
            presskit: z.enum(['public', 'collectives_only', 'private']),
            bio: z.enum(['public', 'collectives_only', 'private']),
            genre: z.enum(['public', 'collectives_only', 'private']),
        }),
    }).transform((v) => privacySettingsFromMode(v.mode))
).default(DEFAULT_PRIVACY_SETTINGS);

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
    bio: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().max(2000, "Máximo de 2000 caracteres").optional()
    ),
    privacySettings: privacySettingsSchema,
});

// artistClaimSchema omits artisticName and location (pre-filled from the restricted profile)
export const artistClaimSchema = artistOnboardingSchema.omit({ artisticName: true, location: true });

export const createOnTheFlyArtistSchema = z.object({
    artisticName: trimmedStr(2, 100, "Nome artístico obrigatório"),
    location: trimmedStr(2, 100, "Localidade obrigatória"),
    email: z.union([z.literal(""), z.string().email("E-mail inválido")]).optional(),
});

export type CreateOnTheFlyArtistInput = z.infer<typeof createOnTheFlyArtistSchema>;

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;   // 5MB
export const MAX_PDF_SIZE   = 20 * 1024 * 1024;  // 20MB

export const fileSchema = z.object({
    photo: z.instanceof(File)
        .refine((f) => f.size <= MAX_PHOTO_SIZE, "Foto deve ter no máximo 5MB")
        .refine((f) => ["image/jpeg", "image/png"].includes(f.type), "Use JPEG ou PNG")
        .nullable(),
    releasePdf: z.instanceof(File)
        .refine((f) => f.size <= MAX_PDF_SIZE, "PDF deve ter no máximo 20MB")
        .refine((f) => f.type === "application/pdf", "Apenas arquivos PDF são aceitos")
        .nullable(),
});

export { trimmedStr };
