import { getHealthPulseForRange } from '../queries';
import { getEventsForRange } from '../events-queries';
import { getRollingThirtyDays } from '../date-range';
import { CalendarGridClient } from './calendar-grid-client';
import type { ConflictLevelRecord } from '../types';

export async function CalendarGrid({ collectiveId }: { collectiveId: string }) {
    const dates = getRollingThirtyDays(new Date());
    const [pulseMap, initialEvents] = await Promise.all([
        getHealthPulseForRange(collectiveId, dates),
        getEventsForRange(collectiveId, dates),
    ]);

    const pulseRecord: ConflictLevelRecord = Object.fromEntries(pulseMap);

    return (
        <CalendarGridClient
            collectiveId={collectiveId}
            dates={dates.map((d) => d.toISOString())}
            pulseRecord={pulseRecord}
            initialEvents={initialEvents}
        />
    );
}
