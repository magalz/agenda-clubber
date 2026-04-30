import { describe, it, expect } from 'vitest';
import { getHealthPulseForRange } from './queries';
import { getRollingThirtyDays, formatDateKey } from './date-range';

describe('getHealthPulseForRange (Story 3.1 stub)', () => {
    it('returns a Map of size 30 with all null values for 30 dates', async () => {
        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        expect(pulseMap.size).toBe(30);

        for (const [key, value] of pulseMap) {
            expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(value).toBeNull();
        }
    });

    it('returns keys matching the date-range YYYY-MM-DD format keys', async () => {
        const dates = getRollingThirtyDays(new Date('2026-01-15T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('any-id', dates);

        for (const [, date] of dates.entries()) {
            expect(pulseMap.get(formatDateKey(date))).toBeNull();
        }
    });
});
