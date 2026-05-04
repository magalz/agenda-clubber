import { describe, it, expect } from 'vitest';
import { evaluateConflictCore, type CandidateData, type OtherData } from './evaluate-conflict';
import type { ResolvedLineupEntry } from '../types';

const entry = (name: string, isLocal: boolean): ResolvedLineupEntry => ({
    name,
    normalizedName: name.toLowerCase(),
    isLocal,
});

const makeCandidate = (date: string, genre: string, lineup: ResolvedLineupEntry[]): CandidateData => ({
    eventDate: date,
    genrePrimary: genre,
    lineup: lineup.map((e) => e.name),
    resolvedLineup: lineup,
});

const makeOther = (date: string, genre: string, lineup: ResolvedLineupEntry[]): OtherData => ({
    eventDate: date,
    genrePrimary: genre,
    resolvedLineup: lineup,
});

describe('evaluateConflictCore', () => {
    it('returns GREEN with no justification when no other events', () => {
        const result = evaluateConflictCore(
            makeCandidate('2026-05-04', 'Techno', [entry('DJ X', false)]),
            []
        );
        expect(result).toEqual({ level: 'green', justification: null, rules: [] });
    });

    it('returns GREEN when others have different genre and no artist overlap', () => {
        const result = evaluateConflictCore(
            makeCandidate('2026-05-04', 'Techno', [entry('DJ X', false)]),
            [makeOther('2026-05-04', 'House', [entry('DJ Y', false)])]
        );
        expect(result.level).toBe('green');
    });

    describe('genre rule', () => {
        it('RED at boundary 3 days (same genre)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'Techno', []),
                [makeOther('2026-05-04', 'Techno', [])]
            );
            expect(result.level).toBe('red');
            expect(result.rules).toHaveLength(1);
            expect(result.rules[0].rule).toBe('genre');
        });

        it('YELLOW at boundary 4 days (same genre)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'Techno', []),
                [makeOther('2026-05-05', 'Techno', [])]
            );
            expect(result.level).toBe('yellow');
        });

        it('YELLOW at boundary 7 days (same genre)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'Techno', []),
                [makeOther('2026-05-08', 'Techno', [])]
            );
            expect(result.level).toBe('yellow');
        });

        it('GREEN at boundary 8 days (same genre)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'Techno', []),
                [makeOther('2026-05-09', 'Techno', [])]
            );
            expect(result.level).toBe('green');
        });
    });

    describe('non-local artist rule', () => {
        it('RED at boundary 7 days', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'House', [entry('DJ X', false)]),
                [makeOther('2026-05-08', 'House', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('red');
            expect(result.rules.some((r) => r.rule === 'non_local_artist')).toBe(true);
        });

        it('YELLOW at boundary 8 days', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'House', [entry('DJ X', false)]),
                [makeOther('2026-05-09', 'House', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('yellow');
        });

        it('YELLOW at boundary 15 days', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'House', [entry('DJ X', false)]),
                [makeOther('2026-05-16', 'House', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('yellow');
        });

        it('GREEN at boundary 16 days', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'House', [entry('DJ X', false)]),
                [makeOther('2026-05-17', 'House', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('green');
        });

        it('ignores local artists (only non-local match triggers)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'House', [entry('DJ X', true)]),
                [makeOther('2026-05-04', 'House', [entry('DJ X', true)])]
            );
            // Both are local, so non-local artist rule should not fire
            // Genre is same but different genre... wait, both are House
            // Actually: same genre + same day → genre RED
            // But the non-local artist rule shouldn't fire because isLocal=true
            expect(result.level).toBe('red'); // because of genre
            expect(result.rules.every((r) => r.rule !== 'non_local_artist')).toBe(true);
        });
    });

    describe('local saturation rule', () => {
        it('null for 1 local artist', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'House', [entry('Local DJ', true)]),
                []
            );
            expect(result.level).toBe('green');
        });

        it('YELLOW for 2 local artists', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'House', [
                    entry('Local A', true),
                    entry('Local B', true),
                ]),
                []
            );
            expect(result.level).toBe('yellow');
            expect(result.rules[0].rule).toBe('local_artist_saturation');
        });

        it('RED for 3 local artists', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'House', [
                    entry('Local A', true),
                    entry('Local B', true),
                    entry('Local C', true),
                ]),
                []
            );
            expect(result.level).toBe('red');
        });

        it('counts local artists across candidate and sameDayOthers', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'House', [entry('Local A', true)]),
                [makeOther('2026-05-04', 'Techno', [entry('Local B', true)])]
            );
            expect(result.level).toBe('yellow');
        });

        it('does not count same-day others with different date', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'Techno', [entry('Local A', true)]),
                [makeOther('2026-05-05', 'House', [entry('Local B', true)])]
            );
            expect(result.level).toBe('green'); // different date + different genre → no rules fire
        });
    });

    describe('multiple simultaneous rules', () => {
        it('genre RED + non-local RED → RED with concatenated justification', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'Techno', [entry('DJ X', false)]),
                [makeOther('2026-05-04', 'Techno', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('red');
            expect(result.rules).toHaveLength(2);
            expect(result.justification).toContain(' + ');
        });

        it('genre YELLOW + non-local YELLOW from two different others → YELLOW', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-01', 'Techno', [entry('DJ X', false)]),
                [
                    makeOther('2026-05-06', 'Techno', []),               // genre YELLOW (5 days)
                    makeOther('2026-05-11', 'Other', [entry('DJ X', false)]), // non-local YELLOW (10 days)
                ]
            );
            expect(result.level).toBe('yellow');
            expect(result.rules).toHaveLength(2);
        });

        it('genre YELLOW + non-local RED → RED (highest wins)', () => {
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'Techno', [entry('DJ X', false)]),
                [
                    makeOther('2026-05-09', 'Techno', []),        // genre YELLOW (5 days)
                    makeOther('2026-05-04', 'other', [entry('DJ X', false)]), // non-local RED (0 days)
                ]
            );
            expect(result.level).toBe('red');
        });
    });

    describe('cross-collective', () => {
        it('evaluates events from different collectives the same way', () => {
            // The engine is collective-agnostic; it just processes data
            const result = evaluateConflictCore(
                makeCandidate('2026-05-04', 'Techno', [entry('DJ X', false)]),
                [makeOther('2026-05-04', 'Techno', [entry('DJ X', false)])]
            );
            expect(result.level).toBe('red');
            expect(result.rules).toHaveLength(2);
        });
    });
});
