-- ============================================================
-- Tabela: profiles
-- Criada pelo projeto (não pelo Supabase Auth — apenas referencia auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname    text NOT NULL,
    role        text NOT NULL CHECK (role IN ('artista', 'produtor')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabela: artists
-- ============================================================
CREATE TABLE IF NOT EXISTS artists (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    artistic_name   text NOT NULL UNIQUE,
    location        text NOT NULL,
    genre_primary   text NOT NULL,
    genre_secondary text,
    social_links    jsonb,
    presskit_url    text,
    release_pdf_url text,
    photo_url       text,
    is_verified     boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabela: collectives
-- ============================================================
CREATE TABLE IF NOT EXISTS collectives (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    location        text NOT NULL,
    logo_url        text,
    description     text,
    genre_primary   text NOT NULL,
    genre_secondary text,
    social_links    jsonb,
    status          text NOT NULL DEFAULT 'pending',
    owner_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabela: collective_members
-- ============================================================
CREATE TABLE IF NOT EXISTS collective_members (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_id   uuid NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
    profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            text NOT NULL DEFAULT 'member',
    joined_at       timestamptz NOT NULL DEFAULT now()
);
