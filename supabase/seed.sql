-- 1. Create a mock profile (assuming an auth user exists or will be created)
-- For local testing, we often use a fixed UUID for the first user
-- Note: In a real environment, you'd create the user via Supabase Auth first.

-- Insert a Collective Profile
insert into profiles (id, role, username, bio)
values ('00000000-0000-0000-0000-000000000001', 'collective', 'ignis_coletivo', 'Coletivo Ignis - Fomentando a cena eletrônica.');

-- Insert a Collective
insert into collectives (id, profile_id, name, description)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Ignis', 'Núcleo de festas experimentais.');

-- Insert an Artist Profile
insert into profiles (id, role, username, bio)
values ('00000000-0000-0000-0000-000000000002', 'artist', 'techno_queen', 'Especialista em Techno Industrial.');

-- Insert an Artist
insert into artists (id, profile_id, name, slug, bio)
values ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Techno Queen', 'techno-queen', 'Residente do Coletivo Ignis.');

-- Insert a Location
insert into locations (id, name, address, capacity)
values ('33333333-3333-3333-3333-333333333333', 'Galpão Industrial', 'Rua da Eletrônica, 123', 500);

-- Insert an Event (Idea Status, Anonymous Visibility)
insert into events (id, collective_id, location_id, title, status, visibility, start_time, end_time)
values ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Festa Secreta', 'Idea', 'Anonymous', '2026-05-01 22:00:00+00', '2026-05-02 06:00:00+00');

-- Link Artist to Event
insert into event_artists (event_id, artist_id)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222');
