import 'server-only';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import type { HealthPulseMap } from './types';
import { formatDateKey } from './date-range';

export async function getHealthPulseForRange(
    collectiveId: string,
    dates: Date[]
): Promise<HealthPulseMap> {
    const start = dates[0];
    const end = dates[dates.length - 1];
    await db
        .select({
            eventDate: events.eventDate,
            count: sql<number>`count(*)::int`,
        })
        .from(events)
        .where(
            and(
                eq(events.collectiveId, collectiveId),
                gte(events.eventDate, formatDateKey(start)),
                lte(events.eventDate, formatDateKey(end))
            )
        )
        .groupBy(events.eventDate);

    return new Map(dates.map((d) => {
        const key = formatDateKey(d);
        return [key, null];
    }));
}
