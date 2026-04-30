import type { ConflictLevel } from './types';

const PRIORITY: Record<ConflictLevel, number> = {
    green: 1,
    yellow: 2,
    red: 3,
};

export function aggregateHighestLevel(levels: ConflictLevel[]): ConflictLevel | null {
    if (!levels.length) return null;
    return levels.reduce((acc, lv) => (PRIORITY[lv] > PRIORITY[acc] ? lv : acc));
}
