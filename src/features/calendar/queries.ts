import 'server-only';

import type { HealthPulseMap } from './types';
import { formatDateKey } from './date-range';

/**
 * Returns a Health Pulse map for a given date range and collective.
 *
 * **Story 3.1 stub:** returns `null` for every date because the `events`
 * table does not yet exist (introduced in Story 3.2). The aggregation logic
 * via `aggregateHighestLevel` will be wired in Story 3.3 when the rules
 * engine (v1.2) is implemented.
 */
export async function getHealthPulseForRange(
    _collectiveId: string,
    dates: Date[]
): Promise<HealthPulseMap> {
    return new Map(dates.map((d) => [formatDateKey(d), null]));
}
