-- ============================================================
-- Migration 013: Create event_conflicts table
-- Spike pré-4: Conflict Persistence Model
-- ============================================================
-- Tabela dedicada para pares de conflito entre eventos,
-- suportando resolução bilateral (Story 4.4).
-- ============================================================

CREATE TABLE IF NOT EXISTS event_conflicts (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_a_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_b_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rule            TEXT NOT NULL,
    level           TEXT NOT NULL CHECK (level IN ('yellow', 'red')),
    justification   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'a_resolved', 'b_resolved', 'consensual_agreement')),
    resolved_by_a   UUID REFERENCES profiles(id),
    resolved_by_b   UUID REFERENCES profiles(id),
    resolved_at_a   TIMESTAMPTZ,
    resolved_at_b   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(event_a_id, event_b_id, rule)
);

CREATE INDEX idx_event_conflicts_event_a ON event_conflicts(event_a_id);
CREATE INDEX idx_event_conflicts_event_b ON event_conflicts(event_b_id);
CREATE INDEX idx_event_conflicts_status ON event_conflicts(status);
