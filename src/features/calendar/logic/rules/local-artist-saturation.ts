import type { RuleHit, ResolvedLineupEntry } from '../../types';

interface SaturationInput {
    eventDate: string;
    resolvedLineup: ResolvedLineupEntry[];
}

export function evaluateLocalSaturationRule(
    candidate: SaturationInput,
    sameDayOthers: SaturationInput[]
): RuleHit | null {
    const localNames = new Set<string>();

    for (const entry of candidate.resolvedLineup) {
        if (entry.isLocal) localNames.add(entry.normalizedName);
    }

    for (const other of sameDayOthers) {
        for (const entry of other.resolvedLineup) {
            if (entry.isLocal) localNames.add(entry.normalizedName);
        }
    }

    const count = localNames.size;

    if (count >= 3) {
        return {
            rule: 'local_artist_saturation',
            level: 'red',
            details: { localArtistCount: count },
        };
    }

    if (count === 2) {
        return {
            rule: 'local_artist_saturation',
            level: 'yellow',
            details: { localArtistCount: count },
        };
    }

    return null;
}
