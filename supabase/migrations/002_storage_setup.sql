-- Create buckets if not exists
insert into storage.buckets (id, name, public)
values ('artist_media', 'artist_media', true)
on conflict (id) do nothing;

-- Set up RLS for storage (simulated or direct SQL)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'artist_media' );

CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'artist_media' );

CREATE POLICY "Owners Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'artist_media' AND auth.uid() = owner);
