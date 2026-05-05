import type { Viewer } from '@/features/artists/visibility';
import type { CalendarEvent } from '../types';

export type { Viewer };

const PLACEHOLDER = 'Em Planejamento';

export function maskEventField(
    value: string,
    isPublic: boolean,
    placeholder: string
): string {
    return isPublic ? value : placeholder;
}

export function filterEventForViewer(
    event: CalendarEvent,
    viewer: Viewer,
    isOwner: boolean
): CalendarEvent {
    if (isOwner || event.status === 'confirmed') return event;

    const name = maskEventField(event.name, event.isNamePublic, PLACEHOLDER);
    const locationName = maskEventField(
        event.locationName,
        event.isLocationPublic,
        PLACEHOLDER
    );
    const lineup = event.isLineupPublic ? event.lineup : [];

    return { ...event, name, locationName, lineup };
}
