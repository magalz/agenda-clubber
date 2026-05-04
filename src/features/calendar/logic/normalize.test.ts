import { describe, it, expect } from 'vitest';
import { normalizeArtistName, parseLocation, isSameLocale, BRAZILIAN_UFS } from './normalize';

describe('normalizeArtistName', () => {
    it('lowercases', () => {
        expect(normalizeArtistName('DJ X')).toBe('dj x');
    });

    it('trims', () => {
        expect(normalizeArtistName('  DJ X  ')).toBe('dj x');
    });

    it('collapses multiple spaces', () => {
        expect(normalizeArtistName('DJ   X')).toBe('dj x');
    });

    it('strips diacritics', () => {
        expect(normalizeArtistName('DJ Curaçao')).toBe('dj curacao');
    });

    it('handles complex diacritics', () => {
        expect(normalizeArtistName('João Gomes')).toBe('joao gomes');
    });

    it('handles empty string', () => {
        expect(normalizeArtistName('')).toBe('');
    });
});

describe('parseLocation', () => {
    it('parses "São Paulo, SP"', () => {
        expect(parseLocation('São Paulo, SP')).toEqual({ city: 'são paulo', uf: 'SP' });
    });

    it('parses "Recife, PE"', () => {
        expect(parseLocation('Recife, PE')).toEqual({ city: 'recife', uf: 'PE' });
    });

    it('returns null for null input', () => {
        expect(parseLocation(null)).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(parseLocation('')).toBeNull();
    });

    it('returns null for string without comma', () => {
        expect(parseLocation('São Paulo')).toBeNull();
    });

    it('returns null for invalid UF', () => {
        expect(parseLocation('São Paulo, XX')).toBeNull();
    });

    it('returns null for UF with lowercase', () => {
        // UF should be uppercased internally
        expect(parseLocation('São Paulo, sp')).toEqual({ city: 'são paulo', uf: 'SP' });
    });

    it('handles extra commas (uses last segment as UF)', () => {
        expect(parseLocation('Rio, de, Janeiro, RJ')).toEqual({ city: 'rio', uf: 'RJ' });
    });

    it('handles all 27 UFs', () => {
        for (const uf of BRAZILIAN_UFS) {
            expect(parseLocation(`City, ${uf}`)).toEqual({ city: 'city', uf });
        }
    });
});

describe('isSameLocale', () => {
    it('returns true for identical locations', () => {
        expect(isSameLocale('Recife, PE', 'Recife, PE')).toBe(true);
    });

    it('returns true for same city/UF with different case', () => {
        expect(isSameLocale('recife, pe', 'Recife, PE')).toBe(true);
    });

    it('returns false for different cities same UF', () => {
        expect(isSameLocale('Recife, PE', 'Olinda, PE')).toBe(false);
    });

    it('returns false for same city different UF', () => {
        expect(isSameLocale('Recife, PE', 'Recife, SP')).toBe(false);
    });

    it('returns false when first is null', () => {
        expect(isSameLocale(null, 'Recife, PE')).toBe(false);
    });

    it('returns false when second is null', () => {
        expect(isSameLocale('Recife, PE', null)).toBe(false);
    });

    it('returns false when first has invalid UF', () => {
        expect(isSameLocale('Recife, XX', 'Recife, PE')).toBe(false);
    });

    it('returns false when both are null', () => {
        expect(isSameLocale(null, null)).toBe(false);
    });
});
