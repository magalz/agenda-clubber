-- ============================================================
-- Migration 014: Align profiles schema for local Supabase compat
-- PR13 — CI local: Supabase local vs CI/PRD schema alignment
-- ============================================================
-- Supabase local (via supabase start) cria profiles com schema
-- diferente do que nossas migrations 000 esperam. Esta migration
-- garante que as colunas usadas pelo global-setup.ts existam.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE profiles SET user_id = id WHERE user_id IS NULL;
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
