'use server';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { eventFormSchema, updateEventSchema, type EventFormInput, type UpdateEventInput } from './validations';
import { geocode, resolveTimezone } from './map';
import { getViewerContext } from '@/features/auth/helpers';
import { getCurrentUserCollectiveId } from '@/features/collectives/queries';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { evaluateAndPersist, getNeighborIds } from './logic/evaluate-conflict';
import { getCrossCollectiveEventsForRange } from './events-queries';
import { authorizeAndFetchEvent, buildUpdateData, recomputeConflicts, calculateEventDateUtc } from './helpers';
import type { UpdateData } from './helpers';
import type { CalendarEvent } from './types';

type ActionResult<T> = { data: T | null; error: { message: string; code: string } | null };

export async function createEvent(input: EventFormInput): Promise<ActionResult<unknown>> {
    const viewer = await getViewerContext();
    if (viewer.kind !== 'authenticated') {
        return { data: null, error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } };
    }

    const collectiveId = await getCurrentUserCollectiveId();
    if (!collectiveId) {
        return { data: null, error: { message: 'Sem coletivo ativo', code: 'NO_COLLECTIVE' } };
    }

    const parsed = eventFormSchema.safeParse(input);
    if (!parsed.success) {
        return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };
    }

    const { name, eventDate, location, genre, lineup, isNamePublic, isLocationPublic, isLineupPublic } = parsed.data;

    const place = await geocode(location);
    let latitude: string | null = null;
    let longitude: string | null = null;
    let timezone = 'America/Sao_Paulo';

    if (place) {
        latitude = String(place.lat);
        longitude = String(place.lng);
        timezone = await resolveTimezone(place.lat, place.lng);
    }

    const eventDateUtc = calculateEventDateUtc(eventDate, timezone);

    const [event] = await db.insert(events).values({
        collectiveId,
        name,
        eventDate,
        eventDateUtc,
        locationName: location,
        latitude,
        longitude,
        timezone,
        genrePrimary: genre,
        lineup,
        isNamePublic,
        isLocationPublic,
        isLineupPublic,
        createdBy: viewer.profileId,
    }).returning();

    try {
        await evaluateAndPersist(event.id, db);

        const neighborIds = await getNeighborIds(event.id, event.eventDate, db);
        for (const neighborId of neighborIds) {
            try {
                await evaluateAndPersist(neighborId, db);
            } catch (e) {
                console.error(`[ConflictEngine] Failed to recompute neighbor ${neighborId}:`, e);
        }
    }

    revalidatePath('/dashboard/collective');

    return { data: event, error: null };
}

export async function fetchCrossCollectiveEvents(
    dateIsoStrings: string[]
): Promise<CalendarEvent[]> {
    const dates = dateIsoStrings.map((s) => new Date(s));
    return getCrossCollectiveEventsForRange(dates);
}

export async function updateEvent(
    eventId: string,
    input: UpdateEventInput
): Promise<ActionResult<unknown>> {
    const auth = await authorizeAndFetchEvent(eventId);
    if (auth.error) return auth;

    const { existing } = auth.data;

    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
        return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };
    }

    const updateData = await buildUpdateData(parsed.data, existing);
    if (Object.keys(updateData).length === 0) {
        return { data: existing, error: null };
    }

    const [updated] = await db.update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();

    const newDate = parsed.data.eventDate ?? existing.eventDate;
    await recomputeConflicts(eventId, existing.eventDate, newDate);

    revalidatePath('/dashboard/collective');

    return { data: updated, error: null };
}

export async function updateEventStatus(
    eventId: string,
    status: 'planning' | 'confirmed'
): Promise<ActionResult<unknown>> {
    const auth = await authorizeAndFetchEvent(eventId);
    if (auth.error) return auth;

    const { existing } = auth.data;

    if (existing.status === status) {
        return { data: existing, error: null };
    }

    const updateData: UpdateData = {
        status,
    };

    if (status === 'confirmed') {
        updateData.isNamePublic = true;
        updateData.isLocationPublic = true;
        updateData.isLineupPublic = true;
    }

    const [updated] = await db.update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();

    try {
        await evaluateAndPersist(eventId, db);

        const neighborIds = await getNeighborIds(eventId, existing.eventDate, db);
        for (const neighborId of neighborIds) {
            try {
                await evaluateAndPersist(neighborId, db);
            } catch (e) {
                console.error(`[ConflictEngine] Failed to recompute neighbor ${neighborId}:`, e);
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

    console.log('[updateEventStatus] DONE');
    revalidatePath('/dashboard/collective');

    return { data: updated, error: null };
}
