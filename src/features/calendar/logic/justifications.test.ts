import { describe, it, expect } from 'vitest';
import { buildJustification } from './justifications';

describe('buildJustification', () => {
    it('returns null for empty array', () => {
        expect(buildJustification([])).toBeNull();
    });

    it('returns null for all GREEN hits', () => {
        expect(buildJustification([
            { rule: 'genre', level: 'green', details: { genre: 'techno', daysDiff: 10 } },
        ])).toBeNull();
    });

    describe('genre', () => {
        it('0 days → 0h', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'techno', daysDiff: 0 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (techno) em janela de 0h');
        });

        it('1 day → 24h', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'techno', daysDiff: 1 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (techno) em janela de 24h');
        });

        it('2 days → 48h', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'Techno', daysDiff: 2 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h');
        });

        it('3 days → 3 dias', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'House', daysDiff: 3 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (House) em janela de 3 dias');
        });

        it('5 days → 5 dias', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'yellow', details: { genre: 'Techno', daysDiff: 5 } },
            ]);
            expect(result).toBe('Conflito Amarelo: Mesmo gênero (Techno) em janela de 5 dias');
        });

        it('7 days → 7 dias (YELLOW)', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'yellow', details: { genre: 'Techno', daysDiff: 7 } },
            ]);
            expect(result).toBe('Conflito Amarelo: Mesmo gênero (Techno) em janela de 7 dias');
        });
    });

    describe('non-local artist', () => {
        it('1 dia → singular', () => {
            const result = buildJustification([
                { rule: 'non_local_artist', level: 'red', details: { artistName: 'DJ X', daysDiff: 1 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Artista DJ X em outro evento em janela de 1 dia');
        });

        it('RED 5 dias', () => {
            const result = buildJustification([
                { rule: 'non_local_artist', level: 'red', details: { artistName: 'DJ X', daysDiff: 5 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Artista DJ X em outro evento em janela de 5 dias');
        });

        it('YELLOW 12 dias', () => {
            const result = buildJustification([
                { rule: 'non_local_artist', level: 'yellow', details: { artistName: 'DJ X', daysDiff: 12 } },
            ]);
            expect(result).toBe('Conflito Amarelo: Artista DJ X em outro evento em janela de 12 dias');
        });

        it('YELLOW 15 dias (boundary)', () => {
            const result = buildJustification([
                { rule: 'non_local_artist', level: 'yellow', details: { artistName: 'DJ Y', daysDiff: 15 } },
            ]);
            expect(result).toBe('Conflito Amarelo: Artista DJ Y em outro evento em janela de 15 dias');
        });
    });

    describe('local saturation', () => {
        it('RED 3 artistas', () => {
            const result = buildJustification([
                { rule: 'local_artist_saturation', level: 'red', details: { localArtistCount: 3 } },
            ]);
            expect(result).toBe('Conflito Vermelho: 3 artistas locais agendados na mesma data');
        });

        it('YELLOW 2 artistas', () => {
            const result = buildJustification([
                { rule: 'local_artist_saturation', level: 'yellow', details: { localArtistCount: 2 } },
            ]);
            expect(result).toBe('Conflito Amarelo: 2 artistas locais agendados na mesma data');
        });
    });

    describe('multiple hits concatenation', () => {
        it('genre RED + non-local RED', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'Techno', daysDiff: 2 } },
                { rule: 'non_local_artist', level: 'red', details: { artistName: 'DJ X', daysDiff: 5 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h + Conflito Vermelho: Artista DJ X em outro evento em janela de 5 dias');
        });

        it('genre YELLOW + non-local YELLOW', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'yellow', details: { genre: 'House', daysDiff: 5 } },
                { rule: 'non_local_artist', level: 'yellow', details: { artistName: 'DJ Y', daysDiff: 10 } },
            ]);
            expect(result).toBe('Conflito Amarelo: Mesmo gênero (House) em janela de 5 dias + Conflito Amarelo: Artista DJ Y em outro evento em janela de 10 dias');
        });

        it('all three rules', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'Techno', daysDiff: 2 } },
                { rule: 'non_local_artist', level: 'red', details: { artistName: 'DJ X', daysDiff: 3 } },
                { rule: 'local_artist_saturation', level: 'yellow', details: { localArtistCount: 2 } },
            ]);
            expect(result).toContain(' + ');
        });

        it('skips GREEN in concatenation', () => {
            const result = buildJustification([
                { rule: 'genre', level: 'red', details: { genre: 'Techno', daysDiff: 2 } },
                { rule: 'non_local_artist', level: 'green', details: { artistName: 'DJ X', daysDiff: 20 } },
            ]);
            expect(result).toBe('Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h');
        });
    });
});
