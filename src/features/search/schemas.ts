import { z } from 'zod';

const trimmedStr = (min: number, max: number, minMsg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string().min(min, minMsg).max(max, `Máximo de ${max} caracteres`)
  );

export const searchTalentsSchema = z.object({
  query: trimmedStr(2, 100, 'Busca deve ter ao menos 2 caracteres'),
  types: z
    .array(z.enum(['artist', 'collective']))
    .default(['artist', 'collective']),
});

export type SearchTalentsInput = z.infer<typeof searchTalentsSchema>;
