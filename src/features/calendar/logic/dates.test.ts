import { describe, it, expect } from 'vitest';
import { diffCalendarDays } from './dates';

describe('diffCalendarDays', () => {
    it('returns 0 for same date', () => {
        expect(diffCalendarDays('2026-05-04', '2026-05-04')).toBe(0);
    });

    it('returns 1 for adjacent days', () => {
        expect(diffCalendarDays('2026-05-04', '2026-05-05')).toBe(1);
    });

    it('returns 3 for 3 days apart', () => {
        expect(diffCalendarDays('2026-05-01', '2026-05-04')).toBe(3);
    });

    it('handles cross-month boundaries', () => {
        expect(diffCalendarDays('2026-04-30', '2026-05-01')).toBe(1);
    });

    it('handles cross-year boundaries', () => {
        expect(diffCalendarDays('2025-12-31', '2026-01-01')).toBe(1);
    });

    it('returns 15 for 15 days apart', () => {
        expect(diffCalendarDays('2026-05-01', '2026-05-16')).toBe(15);
    });

    it('is order independent (absolute diff)', () => {
        expect(diffCalendarDays('2026-05-16', '2026-05-01')).toBe(15);
    });

    it('returns 16 for 16 days apart', () => {
        expect(diffCalendarDays('2026-05-01', '2026-05-17')).toBe(16);
    });

    it('returns 999 for invalid date string', () => {
        expect(diffCalendarDays('not-a-date', '2026-05-04')).toBe(999);
    });

    it('returns 999 for both invalid dates', () => {
        expect(diffCalendarDays('bad', 'also-bad')).toBe(999);
    });
});
