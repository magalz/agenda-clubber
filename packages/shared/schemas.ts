import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  status: z.enum(['Idea', 'Planning', 'Confirmed']),
  visibility: z.enum(['Anonymous', 'Identified', 'Public']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  locationId: z.string().uuid().optional().nullable(),
});

export type EventSchema = z.infer<typeof eventSchema>;

/**
 * Validates that end time is after start time.
 */
export function validateEventDates(startTime: string, endTime: string) {
  if (new Date(endTime) <= new Date(startTime)) {
    return { valid: false, message: 'End time must be after start time' };
  }
  return { valid: true };
}
