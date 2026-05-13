export type ConflictLevel = 'green' | 'yellow' | 'red';

export type ConflictResolutionStatus = 'open' | 'a_resolved' | 'b_resolved' | 'consensual_agreement';

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
    collectiveId: string;
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

export interface ConflictingEventInfo {
    event: CalendarEvent;
    collective: {
        name: string;
        logoUrl: string | null;
        whatsappPhone: string | null;
        instagramUrl: string | null;
    };
    justification: string;
}
