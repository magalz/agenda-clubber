import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

vi.mock('@/db', () => ({
    db: {
        select: (...args: unknown[]) => mockSelect(...args),
    },
}));

vi.mock('drizzle-orm', () => ({
    sql: vi.fn(),
    and: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    eq: vi.fn(),
}));

vi.mock('@/db/schema/events', () => ({
    events: {},
}));

import { getHealthPulseForRange } from './queries';
import { getRollingThirtyDays, formatDateKey } from './date-range';

describe('getHealthPulseForRange', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWhere.mockResolvedValue([]);
        mockFrom.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
    });

    it('returns a Map of size 30 with all null values for empty DB', async () => {
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

    it('queries the events table', async () => {
        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        await getHealthPulseForRange('test-collective-id', dates);

        expect(mockSelect).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
    });

    it('aggregates RED over GREEN on same day', async () => {
        mockWhere.mockResolvedValue([
            { eventDate: '2026-06-01', conflictLevel: 'green' },
            { eventDate: '2026-06-01', conflictLevel: 'red' },
        ]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        const dayKey = formatDateKey(dates[0]);
        expect(pulseMap.get(dayKey)).toBe('red');
    });

    it('aggregates YELLOW over GREEN on same day', async () => {
        mockWhere.mockResolvedValue([
            { eventDate: '2026-06-01', conflictLevel: 'green' },
            { eventDate: '2026-06-01', conflictLevel: 'yellow' },
        ]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        const dayKey = formatDateKey(dates[0]);
        expect(pulseMap.get(dayKey)).toBe('yellow');
    });

    it('returns null for days with only null conflict levels', async () => {
        mockWhere.mockResolvedValue([
            { eventDate: '2026-06-01', conflictLevel: null },
        ]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        const dayKey = formatDateKey(dates[0]);
        expect(pulseMap.get(dayKey)).toBeNull();
    });

    it('handles mixed null and non-null levels', async () => {
        mockWhere.mockResolvedValue([
            { eventDate: '2026-06-01', conflictLevel: null },
            { eventDate: '2026-06-01', conflictLevel: 'yellow' },
            { eventDate: '2026-06-01', conflictLevel: null },
        ]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        const dayKey = formatDateKey(dates[0]);
        expect(pulseMap.get(dayKey)).toBe('yellow');
    });
});
