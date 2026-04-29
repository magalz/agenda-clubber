import { describe, it, expect } from "vitest";
import { filterArtistForViewer } from "./visibility";
import type { Viewer } from "./visibility";
import type { ArtistPrivacySettings } from "./types";

function makeArtist(overrides: Partial<{
    status: string;
    profileId: string | null;
    privacySettings: ArtistPrivacySettings;
}> = {}) {
    return {
        id: "artist-1",
        artisticName: "Test DJ",
        location: "Fortaleza, CE",
        slug: "test-dj",
        profileId: overrides.profileId ?? "profile-owner",
        status: overrides.status ?? "approved",
        isVerified: true,
        photoUrl: "https://example.com/photo.jpg",
        bio: "Bio text",
        genrePrimary: "Techno",
        genreSecondary: "House",
        socialLinks: { soundcloud: "https://soundcloud.com/testdj" },
        presskitUrl: "https://example.com/presskit.pdf",
        releasePdfUrl: "https://example.com/release.pdf",
        privacySettings: overrides.privacySettings ?? {
            mode: "public" as const,
            fields: {
                social_links: "public" as const,
                presskit: "public" as const,
                bio: "public" as const,
                genre: "public" as const,
            },
        },
    };
}

const anon: Viewer = { kind: "anon" };
const produtor: Viewer = { kind: "authenticated", role: "produtor", profileId: "profile-produtor", isAdmin: false };
const artista: Viewer = { kind: "authenticated", role: "artista", profileId: "profile-artista", isAdmin: false };
const admin: Viewer = { kind: "authenticated", role: "artista", profileId: "profile-admin", isAdmin: true };
const owner: Viewer = { kind: "authenticated", role: "artista", profileId: "profile-owner", isAdmin: false };

describe("filterArtistForViewer — Public mode", () => {
    const artist = makeArtist();

    it("anon sees all public fields", () => {
        const result = filterArtistForViewer(artist, anon);
        expect(result).not.toBeNull();
        expect(result!.artisticName).toBe("Test DJ");
        expect(result!.bio).toBe("Bio text");
        expect(result!.genrePrimary).toBe("Techno");
        expect(result!.socialLinks).not.toBeNull();
        expect(result!.presskitUrl).not.toBeNull();
    });

    it("produtor sees all public fields", () => {
        const result = filterArtistForViewer(artist, produtor);
        expect(result).not.toBeNull();
        expect(result!.bio).toBe("Bio text");
    });
});

describe("filterArtistForViewer — Collectives Only mode", () => {
    const artist = makeArtist({
        privacySettings: {
            mode: "collectives_only",
            fields: {
                social_links: "collectives_only",
                presskit: "collectives_only",
                bio: "collectives_only",
                genre: "collectives_only",
            },
        },
    });

    it("anon does NOT see restricted fields but sees name and location", () => {
        const result = filterArtistForViewer(artist, anon);
        expect(result).not.toBeNull();
        expect(result!.artisticName).toBe("Test DJ");
        expect(result!.location).toBe("Fortaleza, CE");
        expect(result!.bio).toBeNull();
        expect(result!.socialLinks).toBeNull();
        expect(result!.genrePrimary).toBeNull();
        expect(result!.presskitUrl).toBeNull();
    });

    it("artista does NOT see collectives_only fields", () => {
        const result = filterArtistForViewer(artist, artista);
        expect(result!.bio).toBeNull();
        expect(result!.socialLinks).toBeNull();
    });

    it("produtor SEES collectives_only fields", () => {
        const result = filterArtistForViewer(artist, produtor);
        expect(result!.bio).toBe("Bio text");
        expect(result!.socialLinks).not.toBeNull();
        expect(result!.genrePrimary).toBe("Techno");
    });

    it("admin SEES collectives_only fields", () => {
        const result = filterArtistForViewer(artist, admin);
        expect(result!.bio).toBe("Bio text");
    });

    it("owner SEES collectives_only fields", () => {
        const result = filterArtistForViewer(artist, owner);
        expect(result!.bio).toBe("Bio text");
    });
});

describe("filterArtistForViewer — Private mode", () => {
    const artist = makeArtist({
        privacySettings: {
            mode: "private",
            fields: {
                social_links: "private",
                presskit: "private",
                bio: "private",
                genre: "private",
            },
        },
    });

    it("anon does NOT see private fields", () => {
        const result = filterArtistForViewer(artist, anon);
        expect(result).not.toBeNull();
        expect(result!.bio).toBeNull();
        expect(result!.socialLinks).toBeNull();
    });

    it("produtor does NOT see private fields", () => {
        const result = filterArtistForViewer(artist, produtor);
        expect(result!.bio).toBeNull();
    });

    it("owner SEES private fields", () => {
        const result = filterArtistForViewer(artist, owner);
        expect(result!.bio).toBe("Bio text");
        expect(result!.socialLinks).not.toBeNull();
    });

    it("admin SEES private fields", () => {
        const result = filterArtistForViewer(artist, admin);
        expect(result!.bio).toBe("Bio text");
    });
});

describe("filterArtistForViewer — Ghost mode", () => {
    const artist = makeArtist({
        privacySettings: {
            mode: "ghost",
            fields: {
                social_links: "private",
                presskit: "private",
                bio: "private",
                genre: "private",
            },
        },
    });

    it("anon gets null (404)", () => {
        expect(filterArtistForViewer(artist, anon)).toBeNull();
    });

    it("produtor gets null (404)", () => {
        expect(filterArtistForViewer(artist, produtor)).toBeNull();
    });

    it("artista (not owner) gets null (404)", () => {
        expect(filterArtistForViewer(artist, artista)).toBeNull();
    });

    it("owner SEES the profile", () => {
        const result = filterArtistForViewer(artist, owner);
        expect(result).not.toBeNull();
        expect(result!.artisticName).toBe("Test DJ");
    });

    it("admin SEES the profile", () => {
        const result = filterArtistForViewer(artist, admin);
        expect(result).not.toBeNull();
    });
});

describe("filterArtistForViewer — status checks", () => {
    it("pending_approval returns null for anon", () => {
        const artist = makeArtist({ status: "pending_approval" });
        expect(filterArtistForViewer(artist, anon)).toBeNull();
    });

    it("pending_approval returns null for produtor", () => {
        const artist = makeArtist({ status: "pending_approval" });
        expect(filterArtistForViewer(artist, produtor)).toBeNull();
    });

    it("pending_approval returns null for non-owner artista", () => {
        const artist = makeArtist({ status: "pending_approval" });
        expect(filterArtistForViewer(artist, artista)).toBeNull();
    });

    it("approved always visible for anon (non-ghost)", () => {
        const artist = makeArtist({ status: "approved" });
        expect(filterArtistForViewer(artist, anon)).not.toBeNull();
    });

    it("name and location always present on approved public profile", () => {
        const result = filterArtistForViewer(makeArtist(), anon);
        expect(result!.artisticName).toBe("Test DJ");
        expect(result!.location).toBe("Fortaleza, CE");
    });

    it("no profileId artist — not owned by anyone", () => {
        const artist = makeArtist({ profileId: null });
        const result = filterArtistForViewer(artist, artista);
        expect(result).not.toBeNull();
        expect(result!.bio).toBe("Bio text");
    });

    it("photoUrl is always public even when social_links is private", () => {
        const artist = makeArtist({
            privacySettings: {
                mode: "public",
                fields: {
                    social_links: "private",
                    presskit: "private",
                    bio: "private",
                    genre: "private",
                },
            },
        });
        const result = filterArtistForViewer(artist, anon);
        expect(result).not.toBeNull();
        expect(result!.photoUrl).toBe("https://example.com/photo.jpg");
        expect(result!.socialLinks).toBeNull();
    });

    it("photoUrl is null when artist has no photo regardless of visibility", () => {
        const artist = { ...makeArtist(), photoUrl: null };
        const result = filterArtistForViewer(artist, anon);
        expect(result).not.toBeNull();
        expect(result!.photoUrl).toBeNull();
    });

    it("socialLinks returns null for non-object DB value", () => {
        const artist = { ...makeArtist(), socialLinks: "malformed-string" };
        const result = filterArtistForViewer(artist as Parameters<typeof filterArtistForViewer>[0], anon);
        expect(result).not.toBeNull();
        expect(result!.socialLinks).toBeNull();
    });

    it("socialLinks returns null for array DB value", () => {
        const artist = { ...makeArtist(), socialLinks: ["soundcloud", "spotify"] };
        const result = filterArtistForViewer(artist as Parameters<typeof filterArtistForViewer>[0], anon);
        expect(result).not.toBeNull();
        expect(result!.socialLinks).toBeNull();
    });
});
