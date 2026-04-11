'use server';

import { createClient } from '@/utils/supabase/server';
import { maskEvent, MUSICAL_GENRES } from 'shared';

export async function getCalendarEvents(
  startDate: string, 
  endDate: string,
  filters?: {
    genres?: string[];
    regions?: string[];
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('public_events')
    .select(`
      *,
      collective:collectives(name, profile_id),
      location:locations(name, neighborhood, region)
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate);

  if (filters?.genres && filters.genres.length > 0) {
    query = query.in('genre', filters.genres);
  }

  // Region filtering based on locations table
  if (filters?.regions && filters.regions.length > 0) {
    // This is a bit tricky with RLS and Views if not joined correctly.
    // Assuming public_events has location_id or we join it.
    // Our public_events view includes location_id.
    query = query.or(`region.in.(${filters.regions.join(',')}),neighborhood.in.(${filters.regions.join(',')})`, { foreignTable: 'location' });
  }

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) throw new Error(error.message);

  // Apply application-level masking as an extra layer
  return (data || []).map(event => maskEvent(event, user.id));
}

export async function getCalendarFilters() {
  const supabase = await createClient();

  const { data: locations, error } = await supabase
    .from('locations')
    .select('neighborhood, region');

  if (error) throw new Error(error.message);

  const regions = Array.from(new Set(
    (locations || [])
      .flatMap(l => [l.neighborhood, l.region])
      .filter(Boolean)
  )) as string[];

  return {
    genres: [...MUSICAL_GENRES],
    regions: regions.sort()
  };
}
