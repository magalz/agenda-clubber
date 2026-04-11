'use server';

import { createClient } from '@/utils/supabase/server';
import { maskEvent } from 'shared';

export async function getCalendarEvents(startDate: string, endDate: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Use the public_events view for safety
  const { data, error } = await supabase
    .from('public_events')
    .select(`
      *,
      collective:collectives(name, profile_id)
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);

  // Apply application-level masking as an extra layer
  return (data || []).map(event => maskEvent(event, user.id));
}
