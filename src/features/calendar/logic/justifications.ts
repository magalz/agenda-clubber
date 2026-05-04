import type { RuleHit } from '../types';

function describeLevel(level: string): 'Vermelho' | 'Amarelo' {
    return level === 'red' ? 'Vermelho' : 'Amarelo';
}

function formatDays(days: number): string {
    if (days === 0) return '0h';
    if (days === 1) return '24h';
    if (days === 2) return '48h';
    return `${days} dias`;
}

function buildGenreJustification(hit: RuleHit): string {
    const level = describeLevel(hit.level);
    const genre = hit.details.genre as string;
    const days = hit.details.daysDiff as number;
    const window = formatDays(days);
    return `Conflito ${level}: Mesmo gênero (${genre}) em janela de ${window}`;
}

function buildNonLocalArtistJustification(hit: RuleHit): string {
    const level = describeLevel(hit.level);
    const name = hit.details.artistName as string;
    const days = hit.details.daysDiff as number;
    const daysLabel = days === 1 ? 'dia' : 'dias';
    return `Conflito ${level}: Artista ${name} em outro evento em janela de ${days} ${daysLabel}`;
}

function buildLocalSaturationJustification(hit: RuleHit): string {
    const level = describeLevel(hit.level);
    const count = hit.details.localArtistCount as number;
    return `Conflito ${level}: ${count} artistas locais agendados na mesma data`;
}

const BUILDERS: Record<RuleHit['rule'], (hit: RuleHit) => string> = {
    genre: buildGenreJustification,
    non_local_artist: buildNonLocalArtistJustification,
    local_artist_saturation: buildLocalSaturationJustification,
};

export function buildJustification(hits: RuleHit[]): string | null {
    const relevant = hits.filter((h) => h.level !== 'green');
    if (relevant.length === 0) return null;

    return relevant.map((h) => BUILDERS[h.rule](h)).join(' + ');
}
