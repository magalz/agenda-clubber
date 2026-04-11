import { describe, it, expect } from 'vitest';
import { areDatesOverlapping, hasArtistConflict, Event, VALIDATION, validateEventDates, maskEvent } from './index';

describe('Data Masking', () => {
  const event = {
    title: 'Secret Party',
    status: 'Idea',
    visibility: 'Anonymous',
    collective_id: 'c1',
    collective: { name: 'Ignis', profile_id: 'u1' }
  };

  it('should mask title and collective for Anonymous Ideas for non-owners', () => {
    const masked = maskEvent(event, 'u2');
    expect(masked.title).toBe('Reserved Slot');
    expect(masked.collective_id).toBe(null);
  });

  it('should not mask for owners', () => {
    const masked = maskEvent(event, 'u1');
    expect(masked.title).toBe('Secret Party');
    expect(masked.collective_id).toBe('c1');
  });

  it('should not mask Public events', () => {
    const publicEvent = { ...event, visibility: 'Public' };
    const masked = maskEvent(publicEvent, 'u2');
    expect(masked.title).toBe('Secret Party');
  });
});

describe('Validation Helpers', () => {
  it('should validate end time after start time', () => {
    const s = '2026-05-01T22:00:00Z';
    const e = '2026-05-02T06:00:00Z';
    expect(validateEventDates(s, e).valid).toBe(true);
  });

  it('should invalidate end time before start time', () => {
    const s = '2026-05-02T06:00:00Z';
    const e = '2026-05-01T22:00:00Z';
    expect(validateEventDates(s, e).valid).toBe(false);
  });
});

describe('Validation Constants', () => {
  it('should have correct default values', () => {
    expect(VALIDATION.BIO_MAX_LENGTH).toBe(500);
    expect(VALIDATION.USERNAME_MIN_LENGTH).toBe(3);
  });
});

describe('Conflict Engine: Dates', () => {
  it('should detect overlapping date ranges', () => {
    const s1 = '2026-05-01T22:00:00Z';
    const e1 = '2026-05-02T06:00:00Z';

    const s2 = '2026-05-02T04:00:00Z'; // Overlap start
    const e2 = '2026-05-02T10:00:00Z';

    expect(areDatesOverlapping(s1, e1, s2, e2)).toBe(true);
  });

  it('should not detect conflict for non-overlapping dates', () => {
    const s1 = '2026-05-01T22:00:00Z';
    const e1 = '2026-05-02T06:00:00Z';

    const s2 = '2026-05-02T06:00:01Z'; // 1 second after
    const e2 = '2026-05-02T10:00:00Z';

    expect(areDatesOverlapping(s1, e1, s2, e2)).toBe(false);
  });
});

describe('Conflict Engine: Artist Conflict', () => {
  const event1: Event = {
    id: 'e1',
    collectiveId: 'c1',
    title: 'Techno Night',
    status: 'Confirmed',
    visibility: 'Public',
    startTime: '2026-05-01T22:00:00Z',
    endTime: '2026-05-02T06:00:00Z',
    artists: ['art1', 'art2']
  };

  const event2: Event = {
    id: 'e2',
    collectiveId: 'c2',
    title: 'House Party',
    status: 'Idea',
    visibility: 'Identified',
    startTime: '2026-05-02T04:00:00Z', // Overlap
    endTime: '2026-05-02T10:00:00Z',
    artists: ['art1']
  };

  it('should detect artist conflict when the same artist is in two simultaneous events', () => {
    expect(hasArtistConflict('art1', event1, event2)).toBe(true);
  });

  it('should not detect conflict for different artists', () => {
    expect(hasArtistConflict('art2', event1, event2)).toBe(false);
  });
});
