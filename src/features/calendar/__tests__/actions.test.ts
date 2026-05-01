import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/db', () => ({
    db: {
        insert: (...args: unknown[]) => mockInsert(...args),
        select: (...args: unknown[]) => mockSelect(...args),
        update: (...args: unknown[]) => mockUpdate(...args),
    },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn(),
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    }),
}));

vi.mock('@/features/auth/helpers', () => ({
    getViewerContext: vi.fn(),
}));

vi.mock('@/features/collectives/queries', () => ({
    getCurrentUserCollectiveId: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGeocode = vi.fn();
const mockResolveTimezone = vi.fn();
vi.mock('../map', () => ({
    geocode: (...args: unknown[]) => mockGeocode(...args),
    resolveTimezone: (...args: unknown[]) => mockResolveTimezone(...args),
}));

function setupInsertChain(returnedEvent: Record<string, unknown>) {
    mockReturning.mockResolvedValue([returnedEvent]);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
}

function setupSelectChain() {
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ from: mockFrom });
}

function setupUpdateChain() {
    const mockReturning = vi.fn().mockResolvedValue([{ id: 'event-uuid-123' }]);
    mockUpdateWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
}

import { createEvent, updateEvent } from '../actions';

describe('createEvent', () => {
    const validInput = {
        name: 'Festival das Flores',
        eventDate: '2026-06-15',
        location: 'D-Edge, São Paulo',
        genre: 'Techno' as const,
        lineup: [],
    };

    const mockedReturnedEvent = {
        id: 'event-uuid-123',
        collectiveId: 'collective-uuid',
        name: 'Festival das Flores',
        eventDate: '2026-06-15',
        locationName: 'D-Edge, São Paulo',
        genrePrimary: 'Techno',
        lineup: null,
        status: 'planning',
        isNamePublic: true,
        isLocationPublic: false,
        isLineupPublic: false,
        createdBy: 'profile-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupInsertChain(mockedReturnedEvent);
    });

    it('returns UNAUTHORIZED when not authenticated', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({ kind: 'anon' });

        const result = await createEvent(validInput);

        expect(result.error?.code).toBe('UNAUTHORIZED');
        expect(result.data).toBeNull();
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('returns NO_COLLECTIVE when user has no active collective', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        const { getCurrentUserCollectiveId } = await import('@/features/collectives/queries');
        (getCurrentUserCollectiveId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const result = await createEvent(validInput);

        expect(result.error?.code).toBe('NO_COLLECTIVE');
        expect(result.data).toBeNull();
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR for invalid input', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        const { getCurrentUserCollectiveId } = await import('@/features/collectives/queries');
        (getCurrentUserCollectiveId as ReturnType<typeof vi.fn>).mockResolvedValue('collective-uuid');

        const result = await createEvent({ ...validInput, name: 'AB' });

        expect(result.error?.code).toBe('VALIDATION_ERROR');
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('creates event with geocoding', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        const { getCurrentUserCollectiveId } = await import('@/features/collectives/queries');
        (getCurrentUserCollectiveId as ReturnType<typeof vi.fn>).mockResolvedValue('collective-uuid');

        mockGeocode.mockResolvedValue({
            lat: -23.5505,
            lng: -46.6333,
            displayName: 'São Paulo, Brazil',
        });
        mockResolveTimezone.mockResolvedValue('America/Sao_Paulo');

        const result = await createEvent(validInput);

        expect(result.error).toBeNull();
        expect((result.data as Record<string, unknown>)?.id).toBe('event-uuid-123');
        expect(mockGeocode).toHaveBeenCalledWith('D-Edge, São Paulo');
        expect(mockResolveTimezone).toHaveBeenCalledWith(-23.5505, -46.6333);
        expect(mockInsert).toHaveBeenCalled();
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/collective');
    });

    it('creates event without geocoding when geocode returns null', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        const { getCurrentUserCollectiveId } = await import('@/features/collectives/queries');
        (getCurrentUserCollectiveId as ReturnType<typeof vi.fn>).mockResolvedValue('collective-uuid');

        mockGeocode.mockResolvedValue(null);

        const result = await createEvent(validInput);

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(mockGeocode).toHaveBeenCalled();
        expect(mockResolveTimezone).not.toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
    });
});

describe('updateEvent', () => {
    const mockedEvent = {
        id: 'event-uuid-123',
        collectiveId: 'collective-uuid',
        name: 'Festival das Flores',
        eventDate: '2026-06-15',
        eventDateUtc: new Date('2026-06-15T15:00:00Z'),
        locationName: 'D-Edge, São Paulo',
        latitude: '-23.5505',
        longitude: '-46.6333',
        timezone: 'America/Sao_Paulo',
        genrePrimary: 'Techno',
        lineup: null,
        status: 'planning',
        isNamePublic: true,
        isLocationPublic: false,
        isLineupPublic: false,
        createdBy: 'profile-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
        setupUpdateChain();
        mockLimit.mockResolvedValue([mockedEvent]);
    });

    it('returns UNAUTHORIZED when not authenticated', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({ kind: 'anon' });

        const result = await updateEvent('event-uuid-123', { name: 'Updated' });

        expect(result.error?.code).toBe('UNAUTHORIZED');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when event does not exist', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        mockLimit.mockResolvedValue([]);

        const result = await updateEvent('nonexistent-id', { name: 'Updated' });

        expect(result.error?.code).toBe('NOT_FOUND');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when user is not the creator', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'other-profile-uuid',
            isAdmin: false,
        });

        const result = await updateEvent('event-uuid-123', { name: 'Updated' });

        expect(result.error?.code).toBe('FORBIDDEN');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('updates event name successfully', async () => {
        const { getViewerContext } = await import('@/features/auth/helpers');
        (getViewerContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: 'authenticated',
            role: 'produtor',
            profileId: 'profile-uuid',
            isAdmin: false,
        });

        const result = await updateEvent('event-uuid-123', { name: 'Updated Festival' });

        expect(result.error).toBeNull();
        expect(mockUpdate).toHaveBeenCalled();
    });
});
