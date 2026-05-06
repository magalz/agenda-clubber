-- ============================================================
-- Migration 011: Fix RLS divergence for planning events
-- Story HK.2 — Corrigir Divergência RLS e Race Condition
-- ============================================================
-- Problema: A condição AND (is_name_public = true OR ...) na
-- events_select_policy bloqueava planning events com todas as
-- flags false. O app-layer filterEventForViewer sempre preserva
-- genrePrimary independente das flags — RLS não deve bloquear
-- linhas que o app-layer vai mostrar.
-- ============================================================

DROP POLICY IF EXISTS "events_select_policy" ON events;
CREATE POLICY "events_select_policy" ON events
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR status = 'confirmed'
        OR status = 'planning'
    );
