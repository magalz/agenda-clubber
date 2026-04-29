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

async function ArtistContent({ params }: { params: Props["params"] }) {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();
    const [artist, viewer] = await Promise.all([
        getPublicArtistBySlug(normalizedSlug),
        getViewerContext(),
    ]);

    if (!artist) notFound();

    const filtered = filterArtistForViewer(artist, viewer);

    if (!filtered) notFound();

    return <PublicProfile artist={filtered} />;
}

// ArtistPublicPage is synchronous — no dynamic data access outside <Suspense>.
// params and all data fetches are consumed inside ArtistContent (within Suspense),
// as required by cacheComponents: true which treats await params as dynamic data.
export default function ArtistPublicPage({ params }: Props) {
    return (
        <Suspense fallback={null}>
            <ArtistContent params={params} />
        </Suspense>
    );
}
