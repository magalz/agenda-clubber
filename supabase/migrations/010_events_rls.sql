-- ============================================================
-- Migration 010: RLS policies for events table
-- Story 3.4 — Privacidade Granular e Status do Evento
-- ============================================================

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — owner sees all; others see based on status + flags
-- Drizzle bypasses RLS (service role). This is defense-in-depth for
-- client-side Supabase SDK queries and future direct access.
CREATE POLICY IF NOT EXISTS "events_select_policy" ON events
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR status = 'confirmed'
        OR (status = 'planning' AND (is_name_public = true OR is_location_public = true OR is_lineup_public = true))
    );

-- Policy: INSERT — authenticated users only
CREATE POLICY IF NOT EXISTS "events_insert_policy" ON events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: UPDATE — only created_by
CREATE POLICY IF NOT EXISTS "events_update_policy" ON events
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy: DELETE — only created_by
CREATE POLICY IF NOT EXISTS "events_delete_policy" ON events
    FOR DELETE
    USING (created_by = auth.uid());
