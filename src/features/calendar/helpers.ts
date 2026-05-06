import { db } from '@/db';
import { events } from '@/db/schema/events';
import type { UpdateEventInput } from './validations';
import { geocode, resolveTimezone } from './map';
import { getViewerContext } from '@/features/auth/helpers';
import { eq } from 'drizzle-orm';
import { evaluateAndPersist, getNeighborIds } from './logic/evaluate-conflict';

export interface UpdateData {
    name?: string;
    eventDate?: string;
    genrePrimary?: string;
    lineup?: string[];
    locationName?: string;
    latitude?: string | null;
    longitude?: string | null;
    timezone?: string;
    eventDateUtc?: Date;
    isNamePublic?: boolean;
    isLocationPublic?: boolean;
    isLineupPublic?: boolean;
    status?: 'planning' | 'confirmed';
}

export function calculateEventDateUtc(eventDate: string, timezone: string): Date {
    const [year, month, day] = eventDate.split('-').map(Number);
    const noonUTC = new Date(`${eventDate}T12:00:00Z`);

    const utcStr = noonUTC.toLocaleString('en-US', {
        timeZone: 'UTC', hour12: false,
    });
    const tzStr = noonUTC.toLocaleString('en-US', {
        timeZone: timezone, hour12: false,
    });

    const offsetMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
    const offsetMinutes = offsetMs / 60000;
    const utcMs = Date.UTC(year, month - 1, day, 12) - offsetMinutes * 60000;

    return new Date(utcMs);
}

export async function authorizeAndFetchEvent(eventId: string) {
    const viewer = await getViewerContext();
    if (viewer.kind !== 'authenticated') {
        return { data: null, error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } };
    }

    const [existing] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!existing) {
        return { data: null, error: { message: 'Evento não encontrado', code: 'NOT_FOUND' } };
    }

    if (existing.createdBy !== viewer.profileId) {
        return { data: null, error: { message: 'Sem permissão para editar', code: 'FORBIDDEN' } };
    }

    return { data: { existing, viewer }, error: null };
}

export async function buildUpdateData(input: UpdateEventInput, existing: typeof events.$inferSelect): Promise<UpdateData> {
    const updateData: UpdateData = {};
    const { name, eventDate, location, genre, lineup, isNamePublic, isLocationPublic, isLineupPublic, status } = input;

    if (name !== undefined) updateData.name = name;
    if (eventDate !== undefined) updateData.eventDate = eventDate;
    if (genre !== undefined) updateData.genrePrimary = genre;
    if (lineup !== undefined) updateData.lineup = lineup;
    if (isNamePublic !== undefined) updateData.isNamePublic = isNamePublic;
    if (isLocationPublic !== undefined) updateData.isLocationPublic = isLocationPublic;
    if (isLineupPublic !== undefined) updateData.isLineupPublic = isLineupPublic;
    if (status !== undefined) updateData.status = status;

    if (location !== undefined && location !== existing.locationName) {
        updateData.locationName = location;
        const place = await geocode(location);
        if (place) {
            updateData.latitude = String(place.lat);
            updateData.longitude = String(place.lng);
            const tz = await resolveTimezone(place.lat, place.lng);
            updateData.timezone = tz;
            updateData.eventDateUtc = calculateEventDateUtc(eventDate ?? existing.eventDate, tz);
        }
    } else if (eventDate !== undefined) {
        const tz = existing.timezone || 'America/Sao_Paulo';
        updateData.eventDateUtc = calculateEventDateUtc(eventDate, tz);
    }

    return updateData;
}

export async function recomputeConflicts(eventId: string, oldDate: string, newDate: string) {
    try {
        if (oldDate !== newDate) {
            const oldNeighborIds = await getNeighborIds(eventId, oldDate, db);
            for (const neighborId of oldNeighborIds) {
                try {
                    await evaluateAndPersist(neighborId, db);
                } catch (e) {
                    console.error(`[ConflictEngine] Failed to recompute old-neighbor ${neighborId}:`, e);
                }
            }
        }

        await evaluateAndPersist(eventId, db);

        const newNeighborIds = await getNeighborIds(eventId, newDate, db);
        for (const neighborId of newNeighborIds) {
            try {
                await evaluateAndPersist(neighborId, db);
            } catch (e) {
                    console.error(`[ConflictEngine] Failed to recompute new-neighbor ${neighborId}:`, e);
            }
        }
    } catch (e) {
        console.error(`[ConflictEngine] Failed to evaluate event ${eventId}:`, e);
        await db.update(events)
            .set({
                conflictLevel: null,
                conflictJustification: 'Falha ao avaliar — verificar logs',
            })
            .where(eq(events.id, eventId));
    }
}
