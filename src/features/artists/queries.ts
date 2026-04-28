import "server-only";

import { db } from "@/db/index";
import { artists } from "@/db/schema/artists";
import { eq } from "drizzle-orm";

/**
 * Fetches a single artist row by slug for public profile rendering.
 * Returns the raw row (privacy filtering is the caller's responsibility).
 * Only queries approved artists — unapproved profiles are not publicly accessible.
 */
export async function getPublicArtistBySlug(slug: string) {
    const results = await db
        .select({
            id: artists.id,
            artisticName: artists.artisticName,
            location: artists.location,
            slug: artists.slug,
            profileId: artists.profileId,
            status: artists.status,
            isVerified: artists.isVerified,
            photoUrl: artists.photoUrl,
            bio: artists.bio,
            genrePrimary: artists.genrePrimary,
            genreSecondary: artists.genreSecondary,
            socialLinks: artists.socialLinks,
            presskitUrl: artists.presskitUrl,
            releasePdfUrl: artists.releasePdfUrl,
            privacySettings: artists.privacySettings,
        })
        .from(artists)
        .where(eq(artists.slug, slug))
        .limit(1);

    return results[0] ?? null;
}
