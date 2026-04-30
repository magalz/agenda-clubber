import { describe, it, expect } from 'vitest';
import { getRollingThirtyDays, formatDateKey, formatDayLabelPtBr } from './date-range';

describe('getRollingThirtyDays', () => {
    it('returns 30 elements', () => {
        const dates = getRollingThirtyDays(new Date());
        expect(dates).toHaveLength(30);
    });

    it('starts today and covers 30 consecutive days in America/Sao_Paulo', () => {
        const today = new Date('2026-05-01T12:00:00-03:00');
        const dates = getRollingThirtyDays(today);
        expect(formatDateKey(dates[0])).toBe('2026-05-01');
        expect(formatDateKey(dates[29])).toBe('2026-05-30');
    });

    it('crosses month boundary correctly (April 25 -> May 24)', () => {
        const today = new Date('2026-04-25T12:00:00-03:00');
        const dates = getRollingThirtyDays(today);
        expect(formatDateKey(dates[0])).toBe('2026-04-25');
        expect(formatDateKey(dates[4])).toBe('2026-04-29');
        expect(formatDateKey(dates[5])).toBe('2026-04-30');
        expect(formatDateKey(dates[6])).toBe('2026-05-01');
        expect(formatDateKey(dates[29])).toBe('2026-05-24');
    });

    it('handles leap year correctly (2024-02-15 -> 2024-03-15)', () => {
        const today = new Date('2024-02-15T12:00:00-03:00');
        const dates = getRollingThirtyDays(today);
        expect(formatDateKey(dates[13])).toBe('2024-02-28');
        expect(formatDateKey(dates[14])).toBe('2024-02-29');
        expect(formatDateKey(dates[15])).toBe('2024-03-01');
    });

    it('avoids UTC off-by-one — late-night SP time still maps to correct date', () => {
        // 2026-05-02T01:30:00Z = 2026-05-01T22:30:00-03:00 (SP local)
        const todayUtc = new Date('2026-05-02T01:30:00Z');
        const dates = getRollingThirtyDays(todayUtc);
        expect(formatDateKey(dates[0])).toBe('2026-05-01');
    });
});

describe('formatDateKey', () => {
    it('produces YYYY-MM-DD format', () => {
        const d = new Date('2026-06-15T15:00:00-03:00');
        expect(formatDateKey(d)).toBe('2026-06-15');
    });
});

describe('formatDayLabelPtBr', () => {
    it('produces Brazilian Portuguese long date', () => {
        const d = new Date('2026-06-15T15:00:00-03:00');
        expect(formatDayLabelPtBr(d)).toBe('15 de junho de 2026');
    });
});
