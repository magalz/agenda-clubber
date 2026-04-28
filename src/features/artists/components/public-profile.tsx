import { CheckCircle, MapPin, Music, ExternalLink, FileText } from "lucide-react";
import type { PublicArtist } from "@/features/artists/visibility";

type Props = { artist: PublicArtist };

export function PublicProfile({ artist }: Props) {
    const initials = artist.artisticName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const socialEntries = artist.socialLinks
        ? Object.entries(artist.socialLinks).filter(([, v]) => Boolean(v))
        : [];

    return (
        <main className="mx-auto max-w-2xl px-4 py-12">
            {/* Header */}
            <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-xl font-semibold text-muted-foreground">
                    {artist.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={artist.photoUrl}
                            alt={artist.artisticName}
                            className="size-full rounded-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate text-2xl font-bold">{artist.artisticName}</h1>
                        {artist.isVerified && (
                            <CheckCircle
                                className="size-5 shrink-0 text-primary"
                                aria-label="Perfil verificado"
                            />
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" />
                            {artist.location}
                        </span>
                        {artist.genrePrimary && (
                            <span className="flex items-center gap-1">
                                <Music className="size-3.5 shrink-0" />
                                {artist.genrePrimary}
                                {artist.genreSecondary && ` / ${artist.genreSecondary}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bio */}
            {artist.bio && (
                <section className="mt-8">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Bio
                    </h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{artist.bio}</p>
                </section>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && (
                <section className="mt-8">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Links
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                        {socialEntries.map(([platform, url]) => (
                            <li key={platform}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm capitalize text-muted-foreground hover:border-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="size-3.5" />
                                    {platform}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Press kit / Release PDF */}
            {(artist.presskitUrl || artist.releasePdfUrl) && (
                <section className="mt-8">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Material
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {artist.presskitUrl && (
                            <a
                                href={artist.presskitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
                            >
                                <FileText className="size-3.5" />
                                Press Kit
                            </a>
                        )}
                        {artist.releasePdfUrl && (
                            <a
                                href={artist.releasePdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
                            >
                                <FileText className="size-3.5" />
                                Release PDF
                            </a>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
}
