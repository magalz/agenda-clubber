'use server';

import { db } from '@/db';
import { events } from '@/db/schema/events';
import { eventFormSchema, type EventFormInput } from './validations';
import { geocode, resolveTimezone } from './map';
import { getViewerContext } from '@/features/auth/helpers';
import { getCurrentUserCollectiveId } from '@/features/collectives/queries';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

type ActionResult<T> = { data: T | null; error: { message: string; code: string } | null };

interface UpdateData {
    name?: string;
    eventDate?: string;
    genrePrimary?: string;
    lineup?: string[];
    locationName?: string;
    latitude?: string | null;
    longitude?: string | null;
    timezone?: string;
    eventDateUtc?: Date;
}

function calculateEventDateUtc(eventDate: string, timezone: string): Date {
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

    const { name, eventDate, location, genre, lineup } = parsed.data;

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
        createdBy: viewer.profileId,
    }).returning();

    revalidatePath('/dashboard/collective');

    return { data: event, error: null };
}

export async function updateEvent(
    eventId: string,
    input: Partial<EventFormInput>
): Promise<ActionResult<unknown>> {
    const viewer = await getViewerContext();
    if (viewer.kind !== 'authenticated') {
        return { data: null, error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } };
    }

    const existing = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!existing.length) {
        return { data: null, error: { message: 'Evento não encontrado', code: 'NOT_FOUND' } };
    }

    if (existing[0].createdBy !== viewer.profileId) {
        return { data: null, error: { message: 'Sem permissão para editar', code: 'FORBIDDEN' } };
    }

    const parsed = eventFormSchema.partial().safeParse(input);
    if (!parsed.success) {
        return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };
    }

    const updateData: UpdateData = {};
    const { name, eventDate, location, genre, lineup } = parsed.data;

    if (name !== undefined) updateData.name = name;
    if (eventDate !== undefined) updateData.eventDate = eventDate;
    if (genre !== undefined) updateData.genrePrimary = genre;
    if (lineup !== undefined) updateData.lineup = lineup;

    if (location !== undefined && location !== existing[0].locationName) {
        updateData.locationName = location;
        const place = await geocode(location);
        if (place) {
            updateData.latitude = String(place.lat);
            updateData.longitude = String(place.lng);
            const tz = await resolveTimezone(place.lat, place.lng);
            updateData.timezone = tz;
            updateData.eventDateUtc = calculateEventDateUtc(eventDate ?? existing[0].eventDate, tz);
        }
    } else if (eventDate !== undefined) {
        const tz = existing[0].timezone || 'America/Sao_Paulo';
        updateData.eventDateUtc = calculateEventDateUtc(eventDate, tz);
    }

    if (Object.keys(updateData).length === 0) {
        return { data: existing[0], error: null };
    }

    const [updated] = await db.update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();

    revalidatePath('/dashboard/collective');

    return { data: updated, error: null };
}
