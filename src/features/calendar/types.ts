export type ConflictLevel = 'green' | 'yellow' | 'red';

export type HealthPulseMap = Map<string, ConflictLevel | null>;

export type ConflictLevelRecord = Record<string, ConflictLevel | null>;
