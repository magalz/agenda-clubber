'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { maskEvent } from 'shared';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeConfig {
  currentUserId: string;
  onEventChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

export function useEventsRealtime({ currentUserId, onEventChange }: RealtimeConfig) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          console.log('Realtime change received:', payload);
          
          let eventData = payload.new;
          
          // For INSERT and UPDATE, we need to fetch the collective details to apply masking correctly
          // as the realtime payload might not contain the joined collective data needed by maskEvent
          if (payload.eventType !== 'DELETE' && eventData && 'id' in eventData) {
            const { data: fullEvent } = await supabase
              .from('public_events')
              .select(`
                *,
                collective:collectives(name, profile_id),
                location:locations(name, neighborhood, region)
              `)
              .eq('id', eventData.id)
              .single();
            
            if (fullEvent) {
              eventData = maskEvent(fullEvent, currentUserId);
            }
          }

          onEventChange({
            ...payload,
            new: eventData
          } as RealtimePostgresChangesPayload<Record<string, unknown>>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, onEventChange]);
}
