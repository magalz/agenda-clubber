import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockGroupBy = vi.fn();

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
        mockFrom.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ groupBy: mockGroupBy });
        mockSelect.mockReturnValue({ from: mockFrom });
    });

    it('returns a Map of size 30 with all null values for 30 dates', async () => {
        mockGroupBy.mockResolvedValue([]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('test-collective-id', dates);

        expect(pulseMap.size).toBe(30);
        for (const [key, value] of pulseMap) {
            expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(value).toBeNull();
        }
    });

    it('returns keys matching the date-range YYYY-MM-DD format keys', async () => {
        mockGroupBy.mockResolvedValue([]);

        const dates = getRollingThirtyDays(new Date('2026-01-15T12:00:00-03:00'));
        const pulseMap = await getHealthPulseForRange('any-id', dates);

        for (const [, date] of dates.entries()) {
            expect(pulseMap.get(formatDateKey(date))).toBeNull();
        }
    });

    it('queries the events table', async () => {
        mockGroupBy.mockResolvedValue([]);

        const dates = getRollingThirtyDays(new Date('2026-06-01T12:00:00-03:00'));
        await getHealthPulseForRange('test-collective-id', dates);

        expect(mockSelect).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
    });
});
