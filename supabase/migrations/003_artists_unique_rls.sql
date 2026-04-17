-- UNIQUE constraint já incluída na criação da tabela (000_create_tables.sql).
-- Esta migration adiciona apenas a política RLS de DELETE ausente no storage.

CREATE POLICY "Owners Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artist_media' AND auth.uid() = owner);
