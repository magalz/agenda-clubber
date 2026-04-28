'use client';

import { useState } from 'react';
import { CheckCircle, MapPin, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ArtistIdentityCardProps = {
  variant: 'verified' | 'restricted';
  artisticName: string;
  location: string;
  genrePrimary?: string | null;
  photoUrl?: string | null;
  /** @reserved Story 2.3 — claim flow. Renders "Claim this Profile" button when provided. */
  onClaim?: () => void;
  compact?: boolean;
};

export function ArtistIdentityCard({
  variant,
  artisticName,
  location,
  genrePrimary,
  photoUrl,
  onClaim,
  compact = false,
}: ArtistIdentityCardProps) {
  const [imgError, setImgError] = useState(false);

  const initials = artisticName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border border-border bg-background px-3',
        compact ? 'py-2' : 'py-3',
        variant === 'verified' &&
          'shadow-[0_0_0_1px_hsl(var(--primary))] border-primary'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground',
          compact ? 'size-8' : 'size-10'
        )}
      >
        {photoUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={artisticName}
            className="size-full rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate font-sans text-sm font-medium text-foreground">
            {artisticName}
          </span>
          {variant === 'verified' && (
            <CheckCircle
              className="size-3.5 shrink-0 text-primary"
              aria-label="Perfil verificado"
            />
          )}
          {variant === 'restricted' && (
            <Badge variant="outline" className="shrink-0 text-[10px] leading-none py-0">
              Restricted
            </Badge>
          )}
        </div>

        {!compact && (
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              {location}
            </span>
            {genrePrimary && (
              <span className="flex items-center gap-1 truncate">
                <Music className="size-3 shrink-0" />
                {genrePrimary}
              </span>
            )}
          </div>
        )}

        {compact && (
          <p className="truncate text-xs text-muted-foreground">{location}</p>
        )}
      </div>

      {/* Claim CTA */}
      {onClaim && (
        <button
          type="button"
          onClick={onClaim}
          className="shrink-0 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          Reivindicar este perfil
        </button>
      )}
    </div>
  );
}
