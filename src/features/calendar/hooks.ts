'use client';

import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { createEvent as createEventAction } from './actions';
import { useCalendarStore } from './store';
import type { EventFormInput } from './validations';
import type { CalendarEvent } from './types';

export function useCreateEvent() {
    return useMutation({
        mutationFn: async (input: EventFormInput) => {
            return createEventAction(input);
        },
    });
}

export function useEventRealtime(collectiveId: string) {
    const addEvent = useCalendarStore((s) => s.addEvent);
    const removeEvent = useCalendarStore((s) => s.removeEvent);

    useEffect(() => {
        if (!collectiveId) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`events:${collectiveId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'events',
                filter: `collective_id=eq.${collectiveId}`,
            }, (payload) => {
                const newEvent = payload.new as Record<string, unknown>;
                addEvent({
                    id: newEvent.id as string,
                    name: newEvent.name as string,
                    eventDate: newEvent.event_date as string,
                    locationName: newEvent.location_name as string,
                    genrePrimary: newEvent.genre_primary as string,
                    lineup: (newEvent.lineup as string[]) ?? [],
                    status: newEvent.status as 'planning' | 'confirmed',
                    isNamePublic: newEvent.is_name_public as boolean,
                    isLocationPublic: newEvent.is_location_public as boolean,
                    isLineupPublic: newEvent.is_lineup_public as boolean,
                    conflictLevel: (newEvent.conflict_level as CalendarEvent['conflictLevel']) ?? null,
                    conflictJustification: (newEvent.conflict_justification as string) ?? null,
                    createdAt: newEvent.created_at as string,
                });
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'events',
                filter: `collective_id=eq.${collectiveId}`,
            }, (payload) => {
                removeEvent((payload.old as Record<string, unknown>).id as string);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [collectiveId, addEvent, removeEvent]);
}
