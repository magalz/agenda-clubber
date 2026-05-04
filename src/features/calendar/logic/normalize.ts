export const BRAZILIAN_UFS: readonly string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export function normalizeArtistName(s: string): string {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function parseLocation(loc: string | null): { city: string; uf: string } | null {
    if (!loc) return null;
    const parts = loc.split(',');
    if (parts.length < 2) return null;
    const city = parts[0].trim();
    const uf = parts[parts.length - 1].trim().toUpperCase();
    if (!BRAZILIAN_UFS.includes(uf as typeof BRAZILIAN_UFS[number])) return null;
    return { city: city.toLowerCase(), uf };
}

export function isSameLocale(a: string | null, b: string | null): boolean {
    const parsedA = parseLocation(a);
    const parsedB = parseLocation(b);
    if (!parsedA || !parsedB) return false;
    return parsedA.city === parsedB.city && parsedA.uf === parsedB.uf;
}
