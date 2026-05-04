import 'server-only';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { and, gte, lte, eq } from 'drizzle-orm';
import type { HealthPulseMap, ConflictLevel } from './types';
import { formatDateKey } from './date-range';
import { aggregateHighestLevel } from './health-pulse';

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
