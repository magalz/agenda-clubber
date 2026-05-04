import { describe, it, expect } from 'vitest';
import { evaluateLocalSaturationRule } from './local-artist-saturation';
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

describe('evaluateLocalSaturationRule', () => {
    it('returns null for 0 local artists', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', []),
            []
        );
        expect(result).toBeNull();
    });

    it('returns null for 1 local artist', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [entry('Local DJ', true)]),
            []
        );
        expect(result).toBeNull();
    });

    it('returns YELLOW for 2 local artists', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('Local DJ A', true),
                entry('Local DJ B', true),
            ]),
            []
        );
        expect(result).toEqual({
            rule: 'local_artist_saturation',
            level: 'yellow',
            details: { localArtistCount: 2 },
        });
    });

    it('returns RED for 3 local artists', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('Local DJ A', true),
                entry('Local DJ B', true),
                entry('Local DJ C', true),
            ]),
            []
        );
        expect(result).toEqual({
            rule: 'local_artist_saturation',
            level: 'red',
            details: { localArtistCount: 3 },
        });
    });

    it('returns RED for 4 local artists', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('A', true),
                entry('B', true),
                entry('C', true),
                entry('D', true),
            ]),
            []
        );
        expect(result!.level).toBe('red');
        expect(result!.details.localArtistCount).toBe(4);
    });

    it('counts local artists across candidate AND sameDayOthers', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [entry('A', true)]),
            [makeEvent('2026-05-04', [entry('B', true)])]
        );
        expect(result!.level).toBe('yellow');
    });

    it('deduplicates by normalizedName', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('DJ X', true),
                entry('dj x', true),
            ]),
            []
        );
        expect(result).toBeNull(); // deduplicated, only 1 unique local
    });

    it('ignores non-local artists', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('DJ X', true),
                entry('DJ Y', false),
                entry('DJ Z', false),
            ]),
            []
        );
        expect(result).toBeNull(); // only 1 local
    });

    it('mixes local + non-local correctly', () => {
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [
                entry('A', true),
                entry('B', false),
                entry('C', true),
            ]),
            []
        );
        expect(result!.level).toBe('yellow');
    });

    it('only considers same date others', () => {
        // sameDayOthers is provided by the orchestrator - rule trusts it
        const sameDayOthers = [
            makeEvent('2026-05-04', [entry('B', true)]),
        ];
        const result = evaluateLocalSaturationRule(
            makeEvent('2026-05-04', [entry('A', true)]),
            sameDayOthers
        );
        expect(result!.level).toBe('yellow');
    });
});
