import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocode, resolveTimezone } from '../map';

describe('geocode', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns GeocodedPlace for a valid query', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([
                {
                    lat: '-23.5505',
                    lon: '-46.6333',
                    display_name: 'São Paulo, Brazil',
                },
            ]),
        });

        const result = await geocode('São Paulo');
        expect(result).toEqual({
            lat: -23.5505,
            lng: -46.6333,
            displayName: 'São Paulo, Brazil',
        });
    });

    it('returns null when Nominatim returns empty array', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        const result = await geocode('xyznonexistent');
        expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await geocode('São Paulo');
        expect(result).toBeNull();
    });

    it('returns null on non-ok response', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
        });

        const result = await geocode('São Paulo');
        expect(result).toBeNull();
    });

    it('encodes the query parameter', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await geocode('São Paulo & SP');
        const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(url).toContain(encodeURIComponent('São Paulo & SP'));
    });
});

describe('resolveTimezone', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns timezone from Open-Meteo response', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ timezone: 'America/Sao_Paulo' }),
        });

        const result = await resolveTimezone(-23.5505, -46.6333);
        expect(result).toBe('America/Sao_Paulo');
    });

    it('returns fallback timezone when Open-Meteo returns no timezone', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        const result = await resolveTimezone(-23.5505, -46.6333);
        expect(result).toBe('America/Sao_Paulo');
    });

    it('returns fallback timezone on network error', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await resolveTimezone(-23.5505, -46.6333);
        expect(result).toBe('America/Sao_Paulo');
    });
});
