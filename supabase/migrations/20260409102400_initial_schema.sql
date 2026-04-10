-- Enable necessary extensions
create extension if not exists "uuid-ossp" with schema extensions;

-- 1. Create custom enums
create type user_role as enum ('collective', 'artist');
create type event_status as enum ('Idea', 'Planning', 'Confirmed');
create type event_visibility as enum ('Anonymous', 'Identified', 'Public');

-- 2. Create tables
-- profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- collectives
create table collectives (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  website_url text,
  instagram_handle text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- artists
create table artists (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  bio text,
  avatar_url text,
  press_kit_url text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- locations
create table locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  city text default 'Fortaleza',
  state text default 'CE',
  capacity integer,
  created_at timestamptz default now()
);

-- events
create table events (
  id uuid default gen_random_uuid() primary key,
  collective_id uuid references collectives(id) on delete cascade not null,
  location_id uuid references locations(id) on delete set null,
  title text not null,
  description text,
  status event_status default 'Idea',
  visibility event_visibility default 'Anonymous',
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- event_artists (junction table)
create table event_artists (
  event_id uuid references events(id) on delete cascade not null,
  artist_id uuid references artists(id) on delete cascade not null,
  primary key (event_id, artist_id)
);

-- 3. Add indexes for performance
create index idx_events_start_time on events(start_time);
create index idx_events_status on events(status);
create index idx_artists_slug on artists(slug);
create index idx_profiles_username on profiles(username);

-- 4. Enable Row Level Security (RLS) on all tables
alter table profiles enable row level security;
alter table collectives enable row level security;
alter table artists enable row level security;
alter table locations enable row level security;
alter table events enable row level security;
alter table event_artists enable row level security;

-- 5. Create RLS Policies

-- 5.1 profiles
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- 5.2 collectives
create policy "Public collectives are viewable by everyone" on collectives for select using (true);
create policy "Collective owners can manage their data" on collectives for all using (
  auth.uid() in (select profile_id from collectives where id = id)
);

-- 5.3 events
-- Anyone can see Public events or non-Idea events
create policy "Public and non-Idea events are viewable by everyone" on events for select using (
  visibility = 'Public' or status != 'Idea'
);

-- Owners can see all their events (including Anonymous/Identified Idea events)
create policy "Owners can see all their events" on events for select using (
  collective_id in (
    select id from collectives where profile_id = auth.uid()
  )
);

-- Owners can manage their events
create policy "Owners can insert their events" on events for insert with check (
  collective_id in (
    select id from collectives where profile_id = auth.uid()
  )
);

create policy "Owners can update their events" on events for update using (
  collective_id in (
    select id from collectives where profile_id = auth.uid()
  )
);

create policy "Owners can delete their events" on events for delete using (
  collective_id in (
    select id from collectives where profile_id = auth.uid()
  )
);

-- 5.4 artists
create policy "Public artists are viewable by everyone" on artists for select using (true);
create policy "Artists can manage their own data" on artists for all using (profile_id = auth.uid());
