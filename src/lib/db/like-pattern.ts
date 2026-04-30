/**
 * Escapa metacaracteres de Postgres LIKE/ILIKE (`%`, `_`, `\`) para que o
 * input do usuário seja casado literalmente. Use antes de montar patterns
 * `%${...}%` em queries com `ilike(column, pattern)`.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&');
}
