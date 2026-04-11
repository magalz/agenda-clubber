'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { eventSchema, validateEventDates, Conflict, Warning } from 'shared';

async function getCollective() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'collective') {
    throw new Error('Only collectives can manage events');
  }

  const { data: collective } = await supabase
    .from('collectives')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!collective) throw new Error('Collective not found');
  return collective.id;
}

export async function checkConflicts(artistIds: string[], startTime: string, endTime: string, excludeEventId?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('check_artist_conflicts', {
    p_artist_ids: artistIds,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_event_id: excludeEventId || null
  });

  if (error) throw new Error(error.message);
  return data as Conflict[];
}

export async function checkWarnings(genre: string, locationId: string, startTime: string, endTime: string, excludeEventId?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('check_genre_region_warnings', {
    p_genre: genre,
    p_location_id: locationId,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_event_id: excludeEventId || null
  });

  if (error) throw new Error(error.message);
  return data as Warning[];
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const collectiveId = await getCollective();

  const artistsRaw = formData.get('artists') as string;
  const artists = artistsRaw ? JSON.parse(artistsRaw) : [];

  const rawData = {
    title: formData.get('title'),
    genre: formData.get('genre'),
    status: formData.get('status'),
    visibility: formData.get('visibility'),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    endTime: new Date(formData.get('endTime') as string).toISOString(),
    locationId: formData.get('locationId') || null,
    artists: artists,
  };

  const validatedData = eventSchema.parse(rawData);

  const dateValidation = validateEventDates(validatedData.startTime, validatedData.endTime);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.message);
  }

  // 1. Create Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      collective_id: collectiveId,
      title: validatedData.title,
      genre: validatedData.genre,
      status: validatedData.status,
      visibility: validatedData.visibility,
      start_time: validatedData.startTime,
      end_time: validatedData.endTime,
      location_id: validatedData.locationId,
    })
    .select()
    .single();

  if (eventError) throw new Error(eventError.message);

  // 2. Add Artists
  if (validatedData.artists.length > 0) {
    const eventArtists = validatedData.artists.map(artistId => ({
      event_id: event.id,
      artist_id: artistId
    }));
    const { error: artistError } = await supabase.from('event_artists').insert(eventArtists);
    if (artistError) throw new Error(artistError.message);
  }

  revalidatePath('/dashboard/events');
  return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  await getCollective(); // Verify role

  const artistsRaw = formData.get('artists') as string;
  const artists = artistsRaw ? JSON.parse(artistsRaw) : [];

  const rawData = {
    title: formData.get('title'),
    genre: formData.get('genre'),
    status: formData.get('status'),
    visibility: formData.get('visibility'),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    endTime: new Date(formData.get('endTime') as string).toISOString(),
    locationId: formData.get('locationId') || null,
    artists: artists,
  };

  const validatedData = eventSchema.parse(rawData);

  const dateValidation = validateEventDates(validatedData.startTime, validatedData.endTime);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.message);
  }

  // 1. Update Event
  const { error: eventError } = await supabase
    .from('events')
    .update({
      title: validatedData.title,
      genre: validatedData.genre,
      status: validatedData.status,
      visibility: validatedData.visibility,
      start_time: validatedData.startTime,
      end_time: validatedData.endTime,
      location_id: validatedData.locationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (eventError) throw new Error(eventError.message);

  // 2. Sync Artists
  await supabase.from('event_artists').delete().eq('event_id', id);
  if (validatedData.artists.length > 0) {
    const eventArtists = validatedData.artists.map(artistId => ({
      event_id: id,
      artist_id: artistId
    }));
    const { error: artistError } = await supabase.from('event_artists').insert(eventArtists);
    if (artistError) throw new Error(artistError.message);
  }

  revalidatePath('/dashboard/events');
  return { success: true };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await getCollective(); // Verify role

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/events');
  return { success: true };
}
