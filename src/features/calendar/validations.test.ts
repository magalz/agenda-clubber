import { describe, it, expect } from 'vitest';
import { eventFormSchema } from './validations';

describe('eventFormSchema', () => {
    const validInput = {
        name: 'Festival das Flores',
        eventDate: '2026-06-15',
        location: 'D-Edge, São Paulo',
        genre: 'Techno' as const,
        lineup: [],
    };

    it('accepts valid minimal input', () => {
        const result = eventFormSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('accepts input with lineup', () => {
        const result = eventFormSchema.safeParse({
            ...validInput,
            lineup: ['DJ A', 'DJ B'],
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
        const result = eventFormSchema.safeParse({ ...validInput, name: '' });
        expect(result.success).toBe(false);
    });

    it('rejects name with less than 3 characters', () => {
        const result = eventFormSchema.safeParse({ ...validInput, name: 'AB' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
        const result = eventFormSchema.safeParse({ ...validInput, eventDate: '15/06/2026' });
        expect(result.success).toBe(false);
    });

    it('rejects empty location', () => {
        const result = eventFormSchema.safeParse({ ...validInput, location: '' });
        expect(result.success).toBe(false);
    });

    it('rejects location with less than 2 characters', () => {
        const result = eventFormSchema.safeParse({ ...validInput, location: 'A' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid genre', () => {
        const result = eventFormSchema.safeParse({ ...validInput, genre: 'InvalidGenre' });
        expect(result.success).toBe(false);
    });

    it('defaults lineup to empty array when not provided', () => {
        const { name, eventDate, location, genre } = validInput;
        const result = eventFormSchema.safeParse({ name, eventDate, location, genre });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.lineup).toEqual([]);
        }
    });

    it('rejects lineup with more than 50 entries', () => {
        const result = eventFormSchema.safeParse({
            ...validInput,
            lineup: Array.from({ length: 51 }, (_, i) => `DJ ${i}`),
        });
        expect(result.success).toBe(false);
    });
});
