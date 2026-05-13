-- ============================================================
-- Migration 012: Add whatsapp_phone to collectives
-- Spike pré-4: WhatsApp Schema Migration
-- ============================================================
ALTER TABLE collectives ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
