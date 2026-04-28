'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db/index';
import { artists } from '@/db/schema/artists';
import { collectives } from '@/db/schema/collectives';
import { or, ilike, eq, sql, and } from 'drizzle-orm';
import { searchTalentsSchema } from './schemas';
import type { SearchHit, SearchErrorCode } from './types';
import { isPlatformAdmin } from '@/features/auth/helpers';

export type SearchTalentsResult = {
  data: SearchHit[] | null;
  error: { message: string; code: SearchErrorCode } | null;
};

export async function searchTalents(
  input: unknown
): Promise<SearchTalentsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: { message: 'Requer login', code: 'UNAUTHORIZED' },
    };
  }

  const parsed = searchTalentsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Query inválida', code: 'VALIDATION_ERROR' },
    };
  }

  const { query, types } = parsed.data;
  const escaped = query.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escaped}%`;

  const isAdmin = await isPlatformAdmin(user.id);

  try {
    const results: SearchHit[] = [];

    if (types.includes('artist')) {
      const artistWhere = isAdmin
        ? or(
            ilike(artists.artisticName, pattern),
            ilike(artists.location, pattern),
            ilike(artists.genrePrimary, pattern)
          )
        : and(
            eq(artists.status, 'approved'),
            or(
              ilike(artists.artisticName, pattern),
              ilike(artists.location, pattern),
              ilike(artists.genrePrimary, pattern)
            )
          );

      const artistHits = await db
        .select({
          kind: sql<'artist'>`'artist'`,
          id: artists.id,
          artisticName: artists.artisticName,
          location: artists.location,
          genrePrimary: artists.genrePrimary,
          photoUrl: artists.photoUrl,
          isVerified: artists.isVerified,
        })
        .from(artists)
        .where(artistWhere)
        .limit(20);

      results.push(...artistHits);
    }

    if (types.includes('collective')) {
      const collectiveHits = await db
        .select({
          kind: sql<'collective'>`'collective'`,
          id: collectives.id,
          name: collectives.name,
          location: collectives.location,
          genrePrimary: collectives.genrePrimary,
          logoUrl: collectives.logoUrl,
        })
        .from(collectives)
        .where(
          and(
            eq(collectives.status, 'active'),
            or(
              ilike(collectives.name, pattern),
              ilike(collectives.location, pattern),
              ilike(collectives.genrePrimary, pattern)
            )
          )
        )
        .limit(40);

      results.push(...collectiveHits);
    }

    const q = query.toLowerCase();
    const sorted = results.sort((a, b) => {
      const aName = a.kind === 'artist' ? a.artisticName : a.name;
      const bName = b.kind === 'artist' ? b.artisticName : b.name;
      const aStarts = aName.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = bName.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aName.localeCompare(bName, 'pt-BR');
    });

    return { data: sorted.slice(0, 20), error: null };
  } catch (err) {
    console.error('[searchTalents] DB error:', err);
    return {
      data: null,
      error: { message: 'Erro ao buscar talentos', code: 'DB_ERROR' },
    };
  }
}
