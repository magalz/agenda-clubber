import 'server-only';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { eventConflicts } from '@/db/schema/event-conflicts';
import { collectives } from '@/db/schema/collectives';
import { and, gte, lte, eq, or, inArray } from 'drizzle-orm';
import type { HealthPulseMap, ConflictLevel, ConflictingEventInfo } from './types';
import { formatDateKey } from './date-range';
import { aggregateHighestLevel } from './health-pulse';
import { filterEventForViewer } from './logic/visibility';

export async function getHealthPulseForRange(
    collectiveId: string,
    dates: Date[]
): Promise<HealthPulseMap> {
    const start = dates[0];
    const end = dates[dates.length - 1];

    const rows = await db
        .select({
            eventDate: events.eventDate,
            conflictLevel: events.conflictLevel,
        })
        .from(events)
        .where(
            and(
                eq(events.collectiveId, collectiveId),
                gte(events.eventDate, formatDateKey(start)),
                lte(events.eventDate, formatDateKey(end))
            )
        );

    const levelsByDay = new Map<string, ConflictLevel[]>();
    for (const row of rows) {
        if (row.conflictLevel) {
            const existing = levelsByDay.get(row.eventDate) ?? [];
            existing.push(row.conflictLevel as ConflictLevel);
            levelsByDay.set(row.eventDate, existing);
        }
    }

    return new Map(dates.map((d) => {
        const key = formatDateKey(d);
        const dayLevels = levelsByDay.get(key) ?? [];
        const level = aggregateHighestLevel(dayLevels);
        return [key, level];
    }));
}

export async function getConflictingEvents(eventId: string): Promise<ConflictingEventInfo[]> {
    const pairs = await db
        .select({
            eventAId: eventConflicts.eventAId,
            eventBId: eventConflicts.eventBId,
            justification: eventConflicts.justification,
        })
        .from(eventConflicts)
        .where(
            and(
                or(eq(eventConflicts.eventAId, eventId), eq(eventConflicts.eventBId, eventId)),
                eq(eventConflicts.status, 'open')
            )
        );

    if (pairs.length === 0) return [];

    const otherIds = pairs.map((p) => (p.eventAId === eventId ? p.eventBId : p.eventAId));

    const otherEvents = await db
        .select()
        .from(events)
        .where(inArray(events.id, otherIds));

    const collectiveIds = [...new Set(otherEvents.map((e) => e.collectiveId))];

    const collectiveRows = await db
        .select({
            id: collectives.id,
            name: collectives.name,
            logoUrl: collectives.logoUrl,
            whatsappPhone: collectives.whatsappPhone,
            socialLinks: collectives.socialLinks,
        })
        .from(collectives)
        .where(inArray(collectives.id, collectiveIds));

    const collectiveMap = new Map(collectiveRows.map((c) => [c.id, c]));

    const justificationByPair = new Map<string, string>();
    for (const p of pairs) {
        const otherId = p.eventAId === eventId ? p.eventBId : p.eventAId;
        justificationByPair.set(otherId, p.justification);
    }

    return otherEvents.map((ev) => {
        const filtered = filterEventForViewer(
            {
                id: ev.id,
                collectiveId: ev.collectiveId,
                name: ev.name,
                eventDate: ev.eventDate,
                locationName: ev.locationName,
                genrePrimary: ev.genrePrimary,
                lineup: (ev.lineup as string[]) ?? [],
                status: ev.status as 'planning' | 'confirmed',
                isNamePublic: ev.isNamePublic,
                isLocationPublic: ev.isLocationPublic,
                isLineupPublic: ev.isLineupPublic,
                conflictLevel: ev.conflictLevel as ConflictLevel | null,
                conflictJustification: ev.conflictJustification,
                createdAt: ev.createdAt.toISOString(),
            },
            { kind: 'anon' },
            false
        );

        const collective = collectiveMap.get(ev.collectiveId);
        const instagramUrl = (collective?.socialLinks as Record<string, string> | null)?.instagram ?? null;

        return {
            event: filtered,
            collective: {
                name: collective?.name ?? 'Coletivo desconhecido',
                logoUrl: collective?.logoUrl ?? null,
                whatsappPhone: collective?.whatsappPhone ?? null,
                instagramUrl,
            },
            justification: justificationByPair.get(ev.id) ?? '',
        };
    });
}
