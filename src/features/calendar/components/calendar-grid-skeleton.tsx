import { ROLLING_DAYS } from '../date-range';

export function CalendarGridSkeleton() {
    return (
        <div className="w-full" role="status" aria-label="Carregando calendário">
            <div className="grid grid-cols-7 gap-px bg-border border border-border">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={`skel-h-${i}`}
                        className="p-2 text-center text-xs font-mono text-muted-foreground border-r border-border last:border-r-0 border-b"
                    >
                        &nbsp;
                    </div>
                ))}
                {Array.from({ length: ROLLING_DAYS }).map((_, i) => (
                    <div
                        key={`skel-${i}`}
                        className="aspect-square bg-muted/30 animate-pulse border border-border"
                    />
                ))}
            </div>
        </div>
    );
}
