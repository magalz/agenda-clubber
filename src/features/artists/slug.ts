/**
 * Generates a URL-safe slug from an artist name.
 * Mirrors the SQL logic in migration 006 (unaccent → lowercase → non-alnum to dash → trim).
 * Latin diacritics are stripped via string normalization (NFD + remove combining marks).
 */
export function slugify(name: string): string {
  const result = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Non-Latin names (Cyrillic, CJK, emoji-only) produce an empty string after stripping.
  // Fall back to 'artist' so uniqueSlug can append a numeric suffix for disambiguation.
  return result || 'artist';
}

/**
 * Returns a unique slug for the given name by appending a numeric suffix if needed.
 * `checkExists` must return true if a slug is already taken.
 */
export async function uniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(name);
  if (!(await checkExists(base))) return base;

  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await checkExists(candidate))) return candidate;
  }

  // Fallback with timestamp suffix (extremely unlikely collision)
  return `${base}-${Date.now()}`;
}
