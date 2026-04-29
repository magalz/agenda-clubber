-- Story 2.4: Perfil público adaptativo e SEO — slug para URLs limpas.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Passo 1: adicionar coluna nullable
ALTER TABLE artists ADD COLUMN IF NOT EXISTS slug text;

-- Passo 2: backfill determinístico com collision-safe ROW_NUMBER
WITH base AS (
  SELECT
    id,
    created_at,
    COALESCE(
      NULLIF(
        trim(both '-' from lower(
          regexp_replace(
            unaccent(artistic_name),
            '[^a-z0-9]+', '-', 'g'
          )
        )),
        ''
      ),
      'artist'
    ) AS candidate
  FROM artists
),
ranked AS (
  SELECT
    id,
    candidate,
    ROW_NUMBER() OVER (PARTITION BY candidate ORDER BY created_at, id) AS rn
  FROM base
)
UPDATE artists
SET slug = CASE
  WHEN ranked.rn = 1 THEN ranked.candidate
  ELSE ranked.candidate || '-' || ranked.rn
END
FROM ranked
WHERE artists.id = ranked.id;

-- Passo 3: NOT NULL + UNIQUE + índice
ALTER TABLE artists ALTER COLUMN slug SET NOT NULL;
ALTER TABLE artists ADD CONSTRAINT artists_slug_key UNIQUE (slug);
CREATE INDEX IF NOT EXISTS artists_slug_idx ON artists(slug);
