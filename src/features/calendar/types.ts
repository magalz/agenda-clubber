export type ConflictLevel = 'green' | 'yellow' | 'red';

export type HealthPulseMap = Map<string, ConflictLevel | null>;

export type ConflictLevelRecord = Record<string, ConflictLevel | null>;

export type DayPulse = { level: ConflictLevel | null; hasEvents: boolean };

export type HealthPulseRecord = Record<string, DayPulse>;

export interface RuleHit {
    rule: 'genre' | 'non_local_artist' | 'local_artist_saturation';
    level: ConflictLevel;
    details: Record<string, unknown>;
}

export interface ConflictEvaluation {
    level: ConflictLevel;
    justification: string | null;
    rules: RuleHit[];
}

export interface ResolvedLineupEntry {
    name: string;
    normalizedName: string;
    isLocal: boolean;
}

export interface CalendarEvent {
    id: string;
    name: string;
    eventDate: string;
    locationName: string;
    genrePrimary: string;
    lineup: string[];
    status: 'planning' | 'confirmed';
    isNamePublic: boolean;
    isLocationPublic: boolean;
    isLineupPublic: boolean;
    conflictLevel: ConflictLevel | null;
    conflictJustification: string | null;
    createdAt: string;
}
