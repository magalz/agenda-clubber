-- ============================================================
-- Adiciona índice único em collective_members (collective_id, profile_id)
-- Sincroniza o banco com o Drizzle schema:
--   src/db/schema/collective-members.ts → uniqueIndex('collective_members_unique_membership')
-- Necessário para ON CONFLICT (collective_id, profile_id) funcionar.
-- Relacionado: Story 3.1 (E2E global-setup seed de membro de coletivo).
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS collective_members_unique_membership
ON collective_members (collective_id, profile_id);
