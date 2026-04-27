-- Story 2.3: Claim e gestão de privacidade.
ALTER TABLE artists ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_approval'
  CHECK (status IN ('pending_approval', 'approved', 'rejected'));
ALTER TABLE artists ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL
  DEFAULT '{"mode":"public","fields":{"social_links":"public","presskit":"public","bio":"public","genre":"public"}}'::jsonb;

-- Backfill: artistas já criados em 2.1 / 1.3 assumem estado compatível com MVP atual.
-- Artistas on-the-fly (is_verified=false, profile_id NULL) entram como 'approved' para manter visibilidade existente
-- (eles já aparecem em busca hoje). Claim futuro os move para pending_approval.
UPDATE artists SET status='approved' WHERE status='pending_approval' AND profile_id IS NULL;
-- Artistas já verificados (Story 1.3) também permanecem 'approved'.
UPDATE artists SET status='approved' WHERE is_verified=true;

-- Índice para filtros frequentes (busca global, admin dashboard futuro).
CREATE INDEX IF NOT EXISTS artists_status_idx ON artists(status);

-- Atualizar RLS de SELECT em artists.
-- Revogar policy anterior de SELECT se permissiva demais; criar nova.
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON artists;
DROP POLICY IF EXISTS "artists_select_public" ON artists;
DROP POLICY IF EXISTS "artists_select_approved_or_owner_or_admin" ON artists;

CREATE POLICY "artists_select_approved_or_owner_or_admin"
ON artists FOR SELECT TO authenticated, anon
USING (
  status = 'approved'
  OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);
