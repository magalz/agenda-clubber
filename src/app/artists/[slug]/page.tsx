import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicArtistBySlug } from "@/features/artists/queries";
import { filterArtistForViewer } from "@/features/artists/visibility";
import { getViewerContext } from "@/features/auth/helpers";
import { PublicProfile } from "@/features/artists/components/public-profile";

// Deduplicate DB calls between generateMetadata and the page component per request.
const cachedGetArtist = cache((slug: string) => getPublicArtistBySlug(slug));
const cachedGetViewer = cache(() => getViewerContext());

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const [artist, viewer] = await Promise.all([
        cachedGetArtist(slug.toLowerCase()),
        cachedGetViewer(),
    ]);

    if (!artist) {
        return { title: "Artista não encontrado — Agenda Clubber", robots: "noindex" };
    }

    const filtered = filterArtistForViewer(artist, viewer);

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

export default async function ArtistPublicPage({ params }: Props) {
    const { slug } = await params;
    const [artist, viewer] = await Promise.all([
        cachedGetArtist(slug.toLowerCase()),
        cachedGetViewer(),
    ]);

    if (!artist) notFound();

    const filtered = filterArtistForViewer(artist, viewer);

    if (!filtered) notFound();

    return <PublicProfile artist={filtered} />;
}
