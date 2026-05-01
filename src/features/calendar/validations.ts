import { z } from 'zod';

export const GENRE_OPTIONS = [
    'Techno', 'House', 'Drum and Bass', 'Trance', 'Progressive House',
    'Minimal', 'Tech House', 'Deep House', 'Hard Techno', 'Melodic Techno',
    'Breaks', 'Jungle', 'UK Garage', 'Disco', 'Funk',
] as const;

export const eventFormSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    location: z.string().min(2, 'Local é obrigatório').max(500),
    genre: z.enum(GENRE_OPTIONS, { message: 'Selecione um gênero' }),
    lineup: z.array(z.string().max(200)).max(50).default([]),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;
