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
    const offsetMatch = timezone ? getTimezoneOffset(timezone) : '-03:00';
    const dateStr = `${eventDate}T12:00:00${offsetMatch}`;
    return new Date(dateStr);
}

function getTimezoneOffset(ianaTimezone: string): string {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: ianaTimezone }));
    const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000;
    const sign = offsetMinutes >= 0 ? '-' : '+';
    const absOffset = Math.abs(offsetMinutes);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

    const updateData: UpdateData = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.eventDate !== undefined) updateData.eventDate = input.eventDate;
    if (input.genre !== undefined) updateData.genrePrimary = input.genre;
    if (input.lineup !== undefined) updateData.lineup = input.lineup;

    if (input.location !== undefined && input.location !== existing[0].locationName) {
        updateData.locationName = input.location;
        const place = await geocode(input.location);
        if (place) {
            updateData.latitude = String(place.lat);
            updateData.longitude = String(place.lng);
            const tz = await resolveTimezone(place.lat, place.lng);
            updateData.timezone = tz;
            if (input.eventDate) {
                updateData.eventDateUtc = calculateEventDateUtc(input.eventDate, tz);
            }
        }
    } else if (input.eventDate !== undefined) {
        const tz = existing[0].timezone || 'America/Sao_Paulo';
        updateData.eventDateUtc = calculateEventDateUtc(input.eventDate, tz);
    }

    const [updated] = await db.update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();

    revalidatePath('/dashboard/collective');

    return { data: updated, error: null };
}
