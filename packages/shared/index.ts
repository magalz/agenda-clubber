/**
 * Conflict Engine & Types for agenda-clubber
 * Responsibility: Centralize validation logic shared between Frontend and Backend.
 */

export const APP_NAME = 'agenda-clubber';

export const VALIDATION = {
  BIO_MAX_LENGTH: 500,
  USERNAME_MIN_LENGTH: 3,
};

export type EventStatus = 'Idea' | 'Planning' | 'Confirmed';
export type EventVisibility = 'Anonymous' | 'Identified' | 'Public';

export interface Artist {
  id: string;
  name: string;
  slug: string;
}

export interface Event {
  id: string;
  collectiveId: string;
  title: string;
  status: EventStatus;
  visibility: EventVisibility;
  startTime: Date | string;
  endTime: Date | string;
  locationId?: string;
  artists?: string[]; // Array of artist IDs
}

/**
 * Checks if two date ranges overlap.
 */
export function areDatesOverlapping(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  return s1 < e2 && s2 < e1;
}

/**
 * Checks if an artist has a conflict between two events.
 */
export function hasArtistConflict(
  artistId: string,
  event1: Event,
  event2: Event
): boolean {
  if (!event1.artists?.includes(artistId) || !event2.artists?.includes(artistId)) {
    return false;
  }

  return areDatesOverlapping(
    event1.startTime,
    event1.endTime,
    event2.startTime,
    event2.endTime
  );
}
