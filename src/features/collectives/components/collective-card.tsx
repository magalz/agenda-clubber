import { MapPin, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

type CollectiveCardProps = {
  name: string;
  location: string;
  genrePrimary: string;
  logoUrl?: string | null;
  compact?: boolean;
};

export function CollectiveCard({
  name,
  location,
  genrePrimary,
  logoUrl,
  compact = false,
}: CollectiveCardProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border border-border bg-background px-3',
        compact ? 'py-2' : 'py-3'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground',
          compact ? 'size-8' : 'size-10'
        )}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="size-full rounded-md object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-medium text-foreground">
          {name}
        </p>

        {compact ? (
          <p className="truncate text-xs text-muted-foreground">{location}</p>
        ) : (
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              {location}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Music className="size-3 shrink-0" />
              {genrePrimary}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
