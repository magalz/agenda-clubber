import 'server-only';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { and, eq, gte, lte } from 'drizzle-orm';
import { formatDateKey } from './date-range';
import type { CalendarEvent } from './types';

export async function getEventsForRange(
    collectiveId: string,
    dates: Date[]
): Promise<CalendarEvent[]> {
    const start = formatDateKey(dates[0]);
    const end = formatDateKey(dates[dates.length - 1]);

    const rows = await db
        .select()
        .from(events)
        .where(
            and(
                eq(events.collectiveId, collectiveId),
                gte(events.eventDate, start),
                lte(events.eventDate, end)
            )
        )
        .orderBy(events.eventDate);

    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        eventDate: r.eventDate,
        locationName: r.locationName,
        genrePrimary: r.genrePrimary,
        lineup: (r.lineup as string[]) ?? [],
        status: r.status as 'planning' | 'confirmed',
        isNamePublic: r.isNamePublic,
        isLocationPublic: r.isLocationPublic,
        isLineupPublic: r.isLineupPublic,
        conflictLevel: r.conflictLevel as CalendarEvent['conflictLevel'],
        conflictJustification: r.conflictJustification,
        createdAt: r.createdAt.toISOString(),
    }));
}
