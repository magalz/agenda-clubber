import type { RuleHit } from '../../types';
import { diffCalendarDays } from '../dates';

interface GenreInput {
    eventDate: string;
    genrePrimary: string;
}

export function evaluateGenreRule(
    candidate: GenreInput,
    others: GenreInput[]
): RuleHit | null {
    const normalizedGenre = candidate.genrePrimary.trim().toLowerCase();
    let bestHit: RuleHit | null = null;

    for (const other of others) {
        if (other.genrePrimary.trim().toLowerCase() !== normalizedGenre) continue;

        const days = diffCalendarDays(candidate.eventDate, other.eventDate);

        if (days <= 3) {
            bestHit = {
                rule: 'genre',
                level: 'red',
                details: { genre: normalizedGenre, daysDiff: days },
            };
        } else if (days <= 7 && (!bestHit || bestHit.level !== 'red')) {
            bestHit = {
                rule: 'genre',
                level: 'yellow',
                details: { genre: normalizedGenre, daysDiff: days },
            };
        }
    }

    return bestHit;
}
