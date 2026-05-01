export type ConflictLevel = 'green' | 'yellow' | 'red';

export type HealthPulseMap = Map<string, ConflictLevel | null>;

export type ConflictLevelRecord = Record<string, ConflictLevel | null>;

export type DayPulse = { level: ConflictLevel | null; hasEvents: boolean };

export type HealthPulseRecord = Record<string, DayPulse>;

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
    createdAt: string;
}
