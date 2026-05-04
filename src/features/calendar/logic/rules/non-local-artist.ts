import type { RuleHit, ResolvedLineupEntry } from '../../types';
import { diffCalendarDays } from '../dates';

interface NonLocalArtistInput {
    eventDate: string;
    resolvedLineup: ResolvedLineupEntry[];
}

export function evaluateNonLocalArtistRule(
    candidate: NonLocalArtistInput,
    others: NonLocalArtistInput[]
): RuleHit | null {
    let bestHit: RuleHit | null = null;

    for (const other of others) {
        const days = diffCalendarDays(candidate.eventDate, other.eventDate);

        for (const candEntry of candidate.resolvedLineup) {
            if (candEntry.isLocal) continue;

            const match = other.resolvedLineup.find(
                (o) => o.normalizedName === candEntry.normalizedName && !o.isLocal
            );
            if (!match) continue;

            if (days <= 7) {
                bestHit = {
                    rule: 'non_local_artist',
                    level: 'red',
                    details: { artistName: candEntry.name, daysDiff: days },
                };
            } else if (days <= 15 && (!bestHit || bestHit.level !== 'red')) {
                bestHit = {
                    rule: 'non_local_artist',
                    level: 'yellow',
                    details: { artistName: candEntry.name, daysDiff: days },
                };
            }
        }
    }

    return bestHit;
}
