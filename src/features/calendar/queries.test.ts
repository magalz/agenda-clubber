import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLeftJoin = vi.fn();

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
    ne: vi.fn(),
    or: vi.fn(),
    inArray: vi.fn(),
}));

vi.mock('@/db/schema/events', () => ({
    events: {},
}));

vi.mock('@/db/schema/event-conflicts', () => ({
    eventConflicts: {},
}));

vi.mock('@/db/schema/collectives', () => ({
    collectives: {},
}));

vi.mock('./logic/visibility', () => ({
    filterEventForViewer: vi.fn((event: Record<string, unknown>) => ({
        ...event,
        name: 'Em Planejamento',
        locationName: 'Em Planejamento',
        lineup: [],
    })),
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

describe('getConflictingEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWhere.mockResolvedValue([]);
        mockFrom.mockReturnValue({ where: mockWhere });
        mockLeftJoin.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
    });

    it('ATDD-4.1-07: returns conflicting events from event_conflicts table', async () => {
        const { getConflictingEvents } = await import('./queries');

        mockWhere.mockResolvedValueOnce([
            { eventAId: 'ev-1', eventBId: 'ev-2', rule: 'genre', level: 'red', justification: 'Mesmo gênero Techno', status: 'open' },
        ]);

        mockWhere.mockResolvedValueOnce([
            {
                id: 'ev-2',
                collectiveId: 'coll-b',
                name: 'Festa Concorrente',
                eventDate: '2026-05-05',
                locationName: 'Recife, PE',
                genrePrimary: 'Techno',
                lineup: ['DJ Externo'],
                status: 'planning',
                isNamePublic: true,
                isLocationPublic: true,
                isLineupPublic: true,
                conflictLevel: 'red',
                conflictJustification: 'Mesmo gênero Techno',
                createdAt: new Date('2026-05-01'),
            },
        ]);

        mockWhere.mockResolvedValueOnce([
            {
                id: 'coll-b',
                name: 'Coletivo B',
                logoUrl: 'https://example.com/logo.png',
                whatsappPhone: '+5511999999999',
                socialLinks: { instagram: '@coletivo_b' },
            },
        ]);

        const result = await getConflictingEvents('ev-1');

        expect(result).toHaveLength(1);
        expect(result[0].collective.name).toBe('Coletivo B');
        expect(result[0].justification).toBe('Mesmo gênero Techno');
    });

    it('ATDD-4.1-08: applies filterEventForViewer to external events', async () => {
        const { getConflictingEvents } = await import('./queries');

        mockWhere.mockResolvedValueOnce([
            { eventAId: 'ev-1', eventBId: 'ev-3', rule: 'genre', level: 'yellow', justification: 'Gênero House próximo', status: 'open' },
        ]);

        mockWhere.mockResolvedValueOnce([
            {
                id: 'ev-3',
                collectiveId: 'coll-c',
                name: 'Festa Privada',
                eventDate: '2026-05-08',
                locationName: 'Local Secreto',
                genrePrimary: 'House',
                lineup: ['Artista X'],
                status: 'planning',
                isNamePublic: false,
                isLocationPublic: false,
                isLineupPublic: false,
                conflictLevel: 'yellow',
                conflictJustification: 'Gênero House próximo',
                createdAt: new Date('2026-05-01'),
            },
        ]);

        mockWhere.mockResolvedValueOnce([
            {
                id: 'coll-c',
                name: 'Coletivo C',
                logoUrl: null,
                whatsappPhone: null,
                socialLinks: null,
            },
        ]);

        const result = await getConflictingEvents('ev-1');

        expect(result).toHaveLength(1);
        expect(result[0].event.name).toBe('Em Planejamento');
        expect(result[0].event.locationName).toBe('Em Planejamento');
    });

    it('returns empty array when no active conflicts', async () => {
        const { getConflictingEvents } = await import('./queries');

        mockWhere.mockResolvedValueOnce([]);

        const result = await getConflictingEvents('ev-no-conflicts');

        expect(result).toEqual([]);
    });
});
