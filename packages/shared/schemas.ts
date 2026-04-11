import { z } from 'zod';

export const MUSICAL_GENRES = [
  'Techno',
  'House',
  'Trance',
  'Psytrance',
  'Bass',
  'Open Format',
  'Electronic (General)',
] as const;

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  genre: z.enum(MUSICAL_GENRES),
  status: z.enum(['Idea', 'Planning', 'Confirmed']),
  visibility: z.enum(['Anonymous', 'Identified', 'Public']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  locationId: z.string().uuid().optional().nullable(),
  artists: z.array(z.string().uuid()).default([]),
});

export type EventSchema = z.infer<typeof eventSchema>;

export interface Conflict {
  event_id: string;
  title: string;
  collective_name: string;
  start_time: string;
  end_time: string;
  visibility: string;
  status: string;
  artist_id: string;
  artist_name: string;
}

export interface Warning {
  event_id: string;
  title: string;
  collective_name: string;
  start_time: string;
  end_time: string;
  genre: string;
  neighborhood: string;
  region: string;
}

/**
 * Masks sensitive event data based on visibility and ownership.
 */
export function maskEvent(event: any, currentUserId?: string) {
  const isOwner = currentUserId && event.collective?.profile_id === currentUserId;
  const isPublic = event.visibility === 'Public' || event.status !== 'Idea';

  if (isOwner || isPublic) {
    return event;
  }

  return {
    ...event,
    title: event.visibility === 'Anonymous' ? 'Reserved Slot' : event.title,
    collective_id: event.visibility === 'Anonymous' ? null : event.collective_id,
    collective: event.visibility === 'Anonymous' ? null : event.collective,
    description: 'Private',
  };
}

/**
 * Validates that end time is after start time.
 */
export function validateEventDates(startTime: string, endTime: string) {
  if (new Date(endTime) <= new Date(startTime)) {
    return { valid: false, message: 'End time must be after start time' };
  }
  return { valid: true };
}
