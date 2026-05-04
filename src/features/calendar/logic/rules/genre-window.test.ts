import { describe, it, expect } from 'vitest';
import { evaluateGenreRule } from './genre-window';

const makeEvent = (date: string, genre: string) => ({
    eventDate: date,
    genrePrimary: genre,
});

describe('evaluateGenreRule', () => {
    it('returns null when no other events', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'Techno'),
            []
        );
        expect(result).toBeNull();
    });

    it('returns null when genres differ', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'Techno'),
            [makeEvent('2026-05-04', 'House')]
        );
        expect(result).toBeNull();
    });

    it('returns RED for same genre within 0 days', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'Techno'),
            [makeEvent('2026-05-04', 'Techno')]
        );
        expect(result).toEqual({
            rule: 'genre',
            level: 'red',
            details: { genre: 'techno', daysDiff: 0 },
        });
    });

    it('returns RED for same genre within 1 day', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'Techno'),
            [makeEvent('2026-05-05', 'Techno')]
        );
        expect(result!.level).toBe('red');
        expect(result!.details.daysDiff).toBe(1);
    });

    it('returns RED for same genre within 3 days (boundary)', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-01', 'Techno'),
            [makeEvent('2026-05-04', 'Techno')]
        );
        expect(result!.level).toBe('red');
    });

    it('returns YELLOW for same genre at 4 days (boundary)', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-01', 'Techno'),
            [makeEvent('2026-05-05', 'Techno')]
        );
        expect(result!.level).toBe('yellow');
    });

    it('returns YELLOW for same genre at 7 days (boundary)', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-01', 'Techno'),
            [makeEvent('2026-05-08', 'Techno')]
        );
        expect(result!.level).toBe('yellow');
    });

    it('returns null for same genre at 8 days', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-01', 'Techno'),
            [makeEvent('2026-05-09', 'Techno')]
        );
        expect(result).toBeNull();
    });

    it('prefers RED over YELLOW with multiple others', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'Techno'),
            [
                makeEvent('2026-05-09', 'Techno'), // 5 days = YELLOW
                makeEvent('2026-05-05', 'Techno'), // 1 day = RED
            ]
        );
        expect(result!.level).toBe('red');
        expect(result!.details.daysDiff).toBe(1);
    });

    it('is case-insensitive', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', 'TECHNO'),
            [makeEvent('2026-05-05', 'techno')]
        );
        expect(result!.level).toBe('red');
    });

    it('handles genre with whitespace', () => {
        const result = evaluateGenreRule(
            makeEvent('2026-05-04', '  Techno  '),
            [makeEvent('2026-05-05', 'Techno')]
        );
        expect(result!.level).toBe('red');
    });
});
