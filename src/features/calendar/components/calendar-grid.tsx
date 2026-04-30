import { getHealthPulseForRange } from '../queries';
import { getRollingThirtyDays } from '../date-range';
import { CalendarGridClient } from './calendar-grid-client';
import type { ConflictLevelRecord } from '../types';

export async function CalendarGrid({ collectiveId }: { collectiveId: string }) {
    const dates = getRollingThirtyDays(new Date());
    const pulseMap = await getHealthPulseForRange(collectiveId, dates);

    const pulseRecord: ConflictLevelRecord = Object.fromEntries(pulseMap);

    return (
        <CalendarGridClient
            dates={dates.map((d) => d.toISOString())}
            pulseRecord={pulseRecord}
        />
    );
}
