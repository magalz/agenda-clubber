import type { ArtistPrivacySettings, PrivacyMode } from "./types";

export type Viewer =
  | { kind: "anon" }
  | { kind: "authenticated"; role: string; profileId: string; isAdmin: boolean };

export type PublicArtist = {
  id: string;
  artisticName: string;
  location: string;
  slug: string;
  isVerified: boolean;
  photoUrl: string | null;
  bio: string | null;
  genrePrimary: string | null;
  genreSecondary: string | null;
  socialLinks: Record<string, string> | null;
  presskitUrl: string | null;
  releasePdfUrl: string | null;
};

type ArtistRow = {
  id: string;
  artisticName: string;
  location: string;
  slug: string;
  profileId: string | null;
  status: string;
  isVerified: boolean;
  photoUrl: string | null;
  bio: string | null;
  genrePrimary: string | null;
  genreSecondary: string | null;
  socialLinks: unknown;
  presskitUrl: string | null;
  releasePdfUrl: string | null;
  privacySettings: ArtistPrivacySettings;
};

function canSeeField(
  fieldVisibility: ArtistPrivacySettings["fields"][keyof ArtistPrivacySettings["fields"]],
  viewer: Viewer,
  isOwner: boolean
): boolean {
  if (isOwner || (viewer.kind === "authenticated" && viewer.isAdmin)) return true;
  if (fieldVisibility === "public") return true;
  if (fieldVisibility === "collectives_only") {
    return viewer.kind === "authenticated" && viewer.role === "produtor";
  }
  // "private" — only owner/admin, already handled above
  return false;
}

/**
 * Filters an artist row for the given viewer, respecting privacy settings.
 * Returns null if the artist should not be visible (Ghost mode for non-privileged viewers,
 * or status !== 'approved' for non-owner/non-admin viewers).
 */
export function filterArtistForViewer(
  artist: ArtistRow,
  viewer: Viewer
): PublicArtist | null {
  const isOwner =
    viewer.kind === "authenticated" &&
    artist.profileId !== null &&
    viewer.profileId === artist.profileId;
  const isAdmin = viewer.kind === "authenticated" && viewer.isAdmin;

  // Only approved profiles are publicly accessible (owner/admin cannot preview pending here)
  if (artist.status !== "approved" && !isOwner && !isAdmin) return null;

  const mode: PrivacyMode = artist.privacySettings.mode;

  // Ghost mode: only owner and admin can view the profile
  if (mode === "ghost" && !isOwner && !isAdmin) return null;

  const { fields } = artist.privacySettings;

  // photoUrl is always public — part of the basic artist card alongside name and location
  const photoUrl = artist.photoUrl;
  const bio = canSeeField(fields.bio, viewer, isOwner) ? artist.bio : null;
  const genrePrimary = canSeeField(fields.genre, viewer, isOwner)
    ? artist.genrePrimary
    : null;
  const genreSecondary = canSeeField(fields.genre, viewer, isOwner)
    ? artist.genreSecondary
    : null;
  const rawSocialLinks = artist.socialLinks;
  const socialLinks =
    canSeeField(fields.social_links, viewer, isOwner) &&
    typeof rawSocialLinks === "object" &&
    rawSocialLinks !== null &&
    !Array.isArray(rawSocialLinks)
      ? (rawSocialLinks as Record<string, string>)
      : null;
  const presskitUrl = canSeeField(fields.presskit, viewer, isOwner)
    ? artist.presskitUrl
    : null;
  const releasePdfUrl = canSeeField(fields.presskit, viewer, isOwner)
    ? artist.releasePdfUrl
    : null;

  return {
    id: artist.id,
    artisticName: artist.artisticName,
    location: artist.location,
    slug: artist.slug,
    isVerified: artist.isVerified,
    photoUrl,
    bio,
    genrePrimary,
    genreSecondary,
    socialLinks,
    presskitUrl,
    releasePdfUrl,
  };
}
