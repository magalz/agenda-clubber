import { Suspense, cache } from "react";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicArtistBySlug } from "@/features/artists/queries";
import { filterArtistForViewer } from "@/features/artists/visibility";
import { getViewerContext } from "@/features/auth/helpers";
import { PublicProfile } from "@/features/artists/components/public-profile";

// Deduplicate DB calls between generateMetadata and ArtistContent per request.
const cachedGetArtist = cache((slug: string) => getPublicArtistBySlug(slug));
const cachedGetViewer = cache(() => getViewerContext());

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const artist = await cachedGetArtist(slug.toLowerCase());

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

async function ArtistContent({ slug }: { slug: string }) {
    const [artist, viewer] = await Promise.all([
        cachedGetArtist(slug),
        cachedGetViewer(),
    ]);

    if (!artist) notFound();

    const filtered = filterArtistForViewer(artist, viewer);

    if (!filtered) notFound();

    return <PublicProfile artist={filtered} />;
}

export default async function ArtistPublicPage({ params }: Props) {
    const { slug } = await params;
    return (
        <Suspense fallback={null}>
            <ArtistContent slug={slug.toLowerCase()} />
        </Suspense>
    );
}
