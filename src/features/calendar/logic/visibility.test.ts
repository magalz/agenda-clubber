import { describe, it, expect } from 'vitest';
import { filterEventForViewer } from './visibility';
import type { Viewer } from '@/features/artists/visibility';
import type { CalendarEvent } from '../types';

const ownerEvent: CalendarEvent = {
    id: 'ev-1',
    collectiveId: 'coll-a',
    name: 'Festa Techno',
    eventDate: '2026-05-04',
    locationName: 'D-Edge, São Paulo',
    genrePrimary: 'Techno',
    lineup: ['DJ A', 'DJ B'],
    status: 'planning',
    isNamePublic: true,
    isLocationPublic: false,
    isLineupPublic: false,
    conflictLevel: null,
    conflictJustification: null,
    createdAt: '2026-05-01T00:00:00.000Z',
};

const planningPrivate: CalendarEvent = {
    ...ownerEvent,
    isNamePublic: false,
    isLocationPublic: false,
    isLineupPublic: false,
};

const planningNamePublic: CalendarEvent = {
    ...ownerEvent,
    isNamePublic: true,
    isLocationPublic: false,
    isLineupPublic: false,
};

const planningLocationPublic: CalendarEvent = {
    ...ownerEvent,
    isNamePublic: false,
    isLocationPublic: true,
    isLineupPublic: false,
};

const planningLineupPublic: CalendarEvent = {
    ...ownerEvent,
    isNamePublic: false,
    isLocationPublic: false,
    isLineupPublic: true,
};

const planningAllPublic: CalendarEvent = {
    ...ownerEvent,
    isNamePublic: true,
    isLocationPublic: true,
    isLineupPublic: true,
};

const confirmedEvent: CalendarEvent = {
    ...ownerEvent,
    status: 'confirmed' as const,
    isNamePublic: true,
    isLocationPublic: true,
    isLineupPublic: true,
};

const anonViewer: Viewer = { kind: 'anon' };

const nonOwnerViewer: Viewer = {
    kind: 'authenticated',
    role: 'produtor',
    profileId: 'other-profile',
    isAdmin: false,
};

describe('filterEventForViewer', () => {
    describe('owner sees everything', () => {
        it('returns full event for owner regardless of status and flags', () => {
            const result = filterEventForViewer(
                planningPrivate,
                nonOwnerViewer,
                true
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('D-Edge, São Paulo');
            expect(result.lineup).toEqual(['DJ A', 'DJ B']);
        });

        it('returns full event for owner in confirmed status', () => {
            const result = filterEventForViewer(
                confirmedEvent,
                nonOwnerViewer,
                true
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('D-Edge, São Paulo');
            expect(result.lineup).toEqual(['DJ A', 'DJ B']);
        });
    });

    describe('non-owner in planning', () => {
        it('hides name, location, lineup when all flags are false', () => {
            const result = filterEventForViewer(
                planningPrivate,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Em Planejamento');
            expect(result.locationName).toBe('Em Planejamento');
            expect(result.lineup).toEqual([]);
            expect(result.genrePrimary).toBe('Techno');
        });

        it('shows name when isNamePublic is true', () => {
            const result = filterEventForViewer(
                planningNamePublic,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('Em Planejamento');
            expect(result.lineup).toEqual([]);
        });

        it('shows location when isLocationPublic is true', () => {
            const result = filterEventForViewer(
                planningLocationPublic,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Em Planejamento');
            expect(result.locationName).toBe('D-Edge, São Paulo');
            expect(result.lineup).toEqual([]);
        });

        it('shows lineup when isLineupPublic is true', () => {
            const result = filterEventForViewer(
                planningLineupPublic,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Em Planejamento');
            expect(result.locationName).toBe('Em Planejamento');
            expect(result.lineup).toEqual(['DJ A', 'DJ B']);
        });

        it('shows everything when all flags are true', () => {
            const result = filterEventForViewer(
                planningAllPublic,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('D-Edge, São Paulo');
            expect(result.lineup).toEqual(['DJ A', 'DJ B']);
        });

        it('always shows genrePrimary regardless of flags', () => {
            const result = filterEventForViewer(
                planningPrivate,
                nonOwnerViewer,
                false
            );
            expect(result.genrePrimary).toBe('Techno');
        });
    });

    describe('non-owner in confirmed', () => {
        it('shows all fields regardless of privacy flags', () => {
            const result = filterEventForViewer(
                confirmedEvent,
                nonOwnerViewer,
                false
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('D-Edge, São Paulo');
            expect(result.lineup).toEqual(['DJ A', 'DJ B']);
        });
    });

    describe('anon viewer', () => {
        it('is treated as non-owner in planning', () => {
            const result = filterEventForViewer(
                planningPrivate,
                anonViewer,
                false
            );
            expect(result.name).toBe('Em Planejamento');
            expect(result.genrePrimary).toBe('Techno');
        });

        it('sees all fields in confirmed', () => {
            const result = filterEventForViewer(
                confirmedEvent,
                anonViewer,
                false
            );
            expect(result.name).toBe('Festa Techno');
            expect(result.locationName).toBe('D-Edge, São Paulo');
        });
    });
});
