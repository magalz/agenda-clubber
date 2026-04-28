import { z } from 'zod';
import { trimmedStr } from '@/features/artists/schemas';

export const searchTalentsSchema = z.object({
  // min=1: server validates non-empty; client guards length<2 for UX.
  query: trimmedStr(1, 100, 'Query inválida'),
  types: z
    .array(z.enum(['artist', 'collective']))
    .default(['artist', 'collective']),
});

export type SearchTalentsInput = z.infer<typeof searchTalentsSchema>;
