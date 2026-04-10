'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { eventSchema, validateEventDates } from 'shared';

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

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const collectiveId = await getCollective();

  const rawData = {
    title: formData.get('title'),
    status: formData.get('status'),
    visibility: formData.get('visibility'),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    endTime: new Date(formData.get('endTime') as string).toISOString(),
    locationId: formData.get('locationId') || null,
  };

  const validatedData = eventSchema.parse(rawData);

  const dateValidation = validateEventDates(validatedData.startTime, validatedData.endTime);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.message);
  }

  const { error } = await supabase.from('events').insert({
    collective_id: collectiveId,
    title: validatedData.title,
    status: validatedData.status,
    visibility: validatedData.visibility,
    start_time: validatedData.startTime,
    end_time: validatedData.endTime,
    location_id: validatedData.locationId,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/events');
  return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  await getCollective(); // Verify role

  const rawData = {
    title: formData.get('title'),
    status: formData.get('status'),
    visibility: formData.get('visibility'),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    endTime: new Date(formData.get('endTime') as string).toISOString(),
    locationId: formData.get('locationId') || null,
  };

  const validatedData = eventSchema.parse(rawData);

  const dateValidation = validateEventDates(validatedData.startTime, validatedData.endTime);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.message);
  }

  const { error } = await supabase
    .from('events')
    .update({
      title: validatedData.title,
      status: validatedData.status,
      visibility: validatedData.visibility,
      start_time: validatedData.startTime,
      end_time: validatedData.endTime,
      location_id: validatedData.locationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

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
