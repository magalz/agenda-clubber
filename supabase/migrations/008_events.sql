-- ============================================================
-- Migration 008: Create events table
-- Story 3.2 — Cadastro de Evento e Geolocalização
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_id uuid NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
    name text NOT NULL,
    event_date date NOT NULL,
    event_date_utc timestamptz NOT NULL,
    location_name text NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    timezone text,
    genre_primary text NOT NULL,
    lineup jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed')),
    is_name_public boolean NOT NULL DEFAULT true,
    is_location_public boolean NOT NULL DEFAULT false,
    is_lineup_public boolean NOT NULL DEFAULT false,
    created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for Health Pulse queries (collective_id + event_date range)
CREATE INDEX IF NOT EXISTS events_collective_date_idx ON events (collective_id, event_date);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON events;

CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
