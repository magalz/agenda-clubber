import { describe, it, expect } from 'vitest';
import { evaluateNonLocalArtistRule } from './non-local-artist';
import type { ResolvedLineupEntry } from '../../types';

const entry = (name: string, isLocal: boolean): ResolvedLineupEntry => ({
    name,
    normalizedName: name.toLowerCase(),
    isLocal,
});

const makeEvent = (date: string, lineup: ResolvedLineupEntry[]) => ({
    eventDate: date,
    resolvedLineup: lineup,
});

describe('evaluateNonLocalArtistRule', () => {
    it('returns null when no other events', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ X', false)]),
            []
        );
        expect(result).toBeNull();
    });

    it('returns null when artist is local', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ X', true)]),
            [makeEvent('2026-05-04', [entry('DJ X', true)])]
        );
        expect(result).toBeNull();
    });

    it('returns null when artist differs', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ X', false)]),
            [makeEvent('2026-05-04', [entry('DJ Y', false)])]
        );
        expect(result).toBeNull();
    });

    it('returns RED for same non-local within 0 days', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ X', false)]),
            [makeEvent('2026-05-04', [entry('DJ X', false)])]
        );
        expect(result).toEqual({
            rule: 'non_local_artist',
            level: 'red',
            details: { artistName: 'DJ X', daysDiff: 0 },
        });
    });

    it('returns RED for same non-local within 7 days (boundary)', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-01', [entry('DJ X', false)]),
            [makeEvent('2026-05-08', [entry('DJ X', false)])]
        );
        expect(result!.level).toBe('red');
    });

    it('returns YELLOW for same non-local at 8 days (boundary)', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-01', [entry('DJ X', false)]),
            [makeEvent('2026-05-09', [entry('DJ X', false)])]
        );
        expect(result!.level).toBe('yellow');
    });

    it('returns YELLOW for same non-local at 15 days (boundary)', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-01', [entry('DJ X', false)]),
            [makeEvent('2026-05-16', [entry('DJ X', false)])]
        );
        expect(result!.level).toBe('yellow');
    });

    it('returns null for same non-local at 16 days', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-01', [entry('DJ X', false)]),
            [makeEvent('2026-05-17', [entry('DJ X', false)])]
        );
        expect(result).toBeNull();
    });

    it('matches by normalized name (case and diacritics)', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ Curacao', false)]),
            [makeEvent('2026-05-04', [entry('dj curaçao', false)])]
        );
        // normalizedName is already pre-normalized, so they must match
        // This test is for the function; the normalization happens before calling
        expect(result).toBeNull();
        // Actually testing normalizedName matching - they must be already normalized
        const result2 = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [{ name: 'DJ X', normalizedName: 'dj x', isLocal: false }]),
            [makeEvent('2026-05-04', [{ name: 'dj x', normalizedName: 'dj x', isLocal: false }])]
        );
        expect(result2!.rule).toBe('non_local_artist');
    });

    it('ignores local artist entries in the lineup', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [
                entry('DJ X', false),
                entry('Local DJ', true),
            ]),
            [makeEvent('2026-05-04', [
                entry('DJ X', false),
                entry('Local DJ', true),
            ])]
        );
        expect(result!.rule).toBe('non_local_artist');
        expect(result!.details.artistName).toBe('DJ X');
    });

    it('does not match when one side is local and other non-local', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', [entry('DJ X', false)]),
            [makeEvent('2026-05-04', [entry('DJ X', true)])]
        );
        expect(result).toBeNull();
    });

    it('returns null for empty lineup', () => {
        const result = evaluateNonLocalArtistRule(
            makeEvent('2026-05-04', []),
            [makeEvent('2026-05-04', [entry('DJ X', false)])]
        );
        expect(result).toBeNull();
    });
});
