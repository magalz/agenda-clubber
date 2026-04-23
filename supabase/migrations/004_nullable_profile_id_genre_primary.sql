-- Story 2.1: Perfil on-the-fly — artistas criados sem auth.user não têm profile_id nem genre_primary.
-- Ambas as colunas tornam-se nullable para suportar is_verified=false até o Claim (Épico 2).
ALTER TABLE artists ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE artists ALTER COLUMN genre_primary DROP NOT NULL;
