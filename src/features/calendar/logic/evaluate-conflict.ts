import 'server-only';

import { db as drizzleDb } from '@/db';
import { events } from '@/db/schema/events';
import { collectives } from '@/db/schema/collectives';
import { artists } from '@/db/schema/artists';
import { eq, and, gte, lte, ne, sql, inArray } from 'drizzle-orm';
import type { ConflictEvaluation, ConflictLevel, ResolvedLineupEntry, RuleHit } from '../types';
import { normalizeArtistName, isSameLocale } from './normalize';
import { evaluateGenreRule } from './rules/genre-window';
import { evaluateNonLocalArtistRule } from './rules/non-local-artist';
import { evaluateLocalSaturationRule } from './rules/local-artist-saturation';
import { buildJustification } from './justifications';

type DbClient = typeof drizzleDb;

const ARTIST_LOOKUP_CHUNK = 100;

function pickHighestLevel(hits: RuleHit[]): ConflictLevel {
    const priority: Record<ConflictLevel, number> = { red: 3, yellow: 2, green: 1 };
    return hits.reduce((acc, h) => (priority[h.level] > priority[acc] ? h.level : acc), 'green' as ConflictLevel);
}

export interface CandidateData {
    eventDate: string;
    genrePrimary: string;
    lineup: string[];
    resolvedLineup: ResolvedLineupEntry[];
}

export interface OtherData {
    eventDate: string;
    genrePrimary: string;
    resolvedLineup: ResolvedLineupEntry[];
}

export function evaluateConflictCore(
    candidate: CandidateData,
    others: OtherData[]
): ConflictEvaluation {
    const sameDayOthers = others.filter((o) => o.eventDate === candidate.eventDate);

    const hits: RuleHit[] = [];

    const genreHit = evaluateGenreRule(
        { eventDate: candidate.eventDate, genrePrimary: candidate.genrePrimary },
        others.map((o) => ({ eventDate: o.eventDate, genrePrimary: o.genrePrimary }))
    );
    if (genreHit) hits.push(genreHit);

    const nonLocalHit = evaluateNonLocalArtistRule(
        { eventDate: candidate.eventDate, resolvedLineup: candidate.resolvedLineup },
        others.map((o) => ({ eventDate: o.eventDate, resolvedLineup: o.resolvedLineup }))
    );
    if (nonLocalHit) hits.push(nonLocalHit);

    const saturationHit = evaluateLocalSaturationRule(
        { eventDate: candidate.eventDate, resolvedLineup: candidate.resolvedLineup },
        sameDayOthers.map((o) => ({ eventDate: o.eventDate, resolvedLineup: o.resolvedLineup }))
    );
    if (saturationHit) hits.push(saturationHit);

    const level = hits.length > 0 ? pickHighestLevel(hits) : 'green';
    const justification = buildJustification(hits);

    return { level, justification, rules: hits };
}

async function fetchArtistLocationMap(
    db: DbClient,
    allNames: string[]
): Promise<Map<string, string | null>> {
    const map = new Map<string, string | null>();
    if (!allNames.length) return map;

    const uniqueNames = [...new Set(allNames.map((n) => n.trim().toLowerCase()))];

    for (let i = 0; i < uniqueNames.length; i += ARTIST_LOOKUP_CHUNK) {
        const chunk = uniqueNames.slice(i, i + ARTIST_LOOKUP_CHUNK);
        const rows = await db
            .select({
                artisticName: artists.artisticName,
                location: artists.location,
            })
            .from(artists)
            .where(inArray(sql`LOWER(${artists.artisticName})`, chunk));

        for (const row of rows) {
            const key = normalizeArtistName(row.artisticName);
            map.set(key, row.location);
        }
    }

    return map;
}

function resolveLineupInMemory(
    lineup: string[],
    hostLocation: string | null,
    artistMap: Map<string, string | null>
): ResolvedLineupEntry[] {
    return lineup.map((name) => {
        const normalizedName = normalizeArtistName(name);
        const artistLocation = artistMap.get(normalizedName) ?? null;
        const isLocal = artistLocation !== null && isSameLocale(artistLocation, hostLocation);
        return { name, normalizedName, isLocal };
    });
}

export async function evaluateConflict(eventId: string, db: DbClient): Promise<ConflictEvaluation> {
    const candidateRows = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    const candidate = candidateRows[0];
    if (!candidate) {
        return { level: 'green', justification: null, rules: [] };
    }

    const startDate = shiftDate(candidate.eventDate, -15);
    const endDate = shiftDate(candidate.eventDate, 15);

    const otherRows = await db
        .select()
        .from(events)
        .where(
            and(
                gte(events.eventDate, startDate),
                lte(events.eventDate, endDate),
                ne(events.id, candidate.id)
            )
        );

    const allCollectiveIds = [...new Set([
        candidate.collectiveId,
        ...otherRows.map((r) => r.collectiveId),
    ])];

    const collectiveRows = await db
        .select({ id: collectives.id, location: collectives.location })
        .from(collectives)
        .where(inArray(collectives.id, allCollectiveIds));

    const collectiveLocationMap = new Map(collectiveRows.map((r) => [r.id, r.location]));

    const allLineupNames = [
        ...((candidate.lineup as string[]) ?? []),
        ...otherRows.flatMap((r) => (r.lineup as string[]) ?? []),
    ];

    const artistMap = await fetchArtistLocationMap(db, allLineupNames);

    const hostLocation = collectiveLocationMap.get(candidate.collectiveId) ?? null;

    const candidateLineup = resolveLineupInMemory(
        (candidate.lineup as string[]) ?? [],
        hostLocation,
        artistMap
    );

    const resolvedOthers: OtherData[] = otherRows.map((other) => {
        const otherHostLocation = collectiveLocationMap.get(other.collectiveId) ?? null;
        const otherLineup = resolveLineupInMemory(
            (other.lineup as string[]) ?? [],
            otherHostLocation,
            artistMap
        );
        return {
            eventDate: other.eventDate,
            genrePrimary: other.genrePrimary,
            resolvedLineup: otherLineup,
        };
    });

    return evaluateConflictCore(
        {
            eventDate: candidate.eventDate,
            genrePrimary: candidate.genrePrimary,
            lineup: (candidate.lineup as string[]) ?? [],
            resolvedLineup: candidateLineup,
        },
        resolvedOthers
    );
}

export async function resolveLineup(
    db: DbClient,
    lineup: string[],
    hostLocation: string | null
): Promise<ResolvedLineupEntry[]> {
    if (!lineup.length) return [];

    const artistMap = await fetchArtistLocationMap(db, lineup);

    return resolveLineupInMemory(lineup, hostLocation, artistMap);
}

export function shiftDate(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
}

export async function evaluateAndPersist(eventId: string, db: DbClient): Promise<ConflictEvaluation> {
    const evaluation = await evaluateConflict(eventId, db);
    await db
        .update(events)
        .set({
            conflictLevel: evaluation.level,
            conflictJustification: evaluation.justification,
        })
        .where(eq(events.id, eventId));
    return evaluation;
}

export async function getNeighborIds(
    eventId: string,
    eventDate: string,
    db: DbClient
): Promise<string[]> {
    const startDate = shiftDate(eventDate, -15);
    const endDate = shiftDate(eventDate, 15);

    const rows = await db
        .select({ id: events.id })
        .from(events)
        .where(
            and(
                gte(events.eventDate, startDate),
                lte(events.eventDate, endDate),
                ne(events.id, eventId)
            )
        );

    return rows.map((r) => r.id);
}
