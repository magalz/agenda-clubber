import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicArtistBySlug } from "@/features/artists/queries";
import { filterArtistForViewer } from "@/features/artists/visibility";
import { getViewerContext } from "@/features/auth/helpers";
import { PublicProfile } from "@/features/artists/components/public-profile";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const artist = await getPublicArtistBySlug(slug.toLowerCase());

    if (!artist) {
        return { title: "Artista não encontrado — Agenda Clubber", robots: "noindex" };
    }

    // Crawlers are always anonymous — derive metadata from the public view.
    const filtered = filterArtistForViewer(artist, { kind: "anon" });

    if (!filtered) {
        return { title: "Artista não encontrado — Agenda Clubber", robots: "noindex" };
    }

    const description =
        filtered.bio
            ? filtered.bio.slice(0, 160)
            : `DJ/Produtor de ${filtered.location}`;

    return {
        title: `${filtered.artisticName} — Agenda Clubber`,
        description,
        alternates: { canonical: `/artists/${slug.toLowerCase()}` },
        openGraph: {
            title: `${filtered.artisticName} — Agenda Clubber`,
            description,
            ...(filtered.photoUrl ? { images: [filtered.photoUrl] } : {}),
        },
    };
}

// Renders inside <Suspense> — only this component accesses cookies via getViewerContext.
async function ArtistViewerView({
    artist,
}: {
    artist: NonNullable<Awaited<ReturnType<typeof getPublicArtistBySlug>>>;
}) {
    const viewer = await getViewerContext();
    const filtered = filterArtistForViewer(artist, viewer);
    // Defensive: modes reaching here (public/collectives_only/private) rarely return null,
    // but guard against future changes to filterArtistForViewer.
    if (!filtered) notFound();
    return <PublicProfile artist={filtered} />;
}

// Page is async and runs pre-checks OUTSIDE <Suspense> so notFound() can set the
// 404 status before streaming starts. getPublicArtistBySlug has "use cache" so it
// satisfies cacheComponents. getViewerContext (cookies) stays inside Suspense.
export default async function ArtistPublicPage({ params }: Props) {
    const { slug } = await params;
    const artist = await getPublicArtistBySlug(slug.toLowerCase());

    // Status/visibility pre-checks that do NOT require viewer context.
    // Owner-preview (pending/ghost) is deferred to Story 5.x; admin to Story 5.1.
    if (!artist) notFound();
    if (artist.status !== "approved") notFound();
    if (artist.privacySettings.mode === "ghost") notFound();

    return (
        <Suspense fallback={null}>
            <ArtistViewerView artist={artist} />
        </Suspense>
    );
}
