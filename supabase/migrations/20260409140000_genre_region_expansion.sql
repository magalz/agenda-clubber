-- Migration: Schema Expansion for Genre and Region Conflict Detection

-- 1. Create musical_genre enum
create type musical_genre as enum (
  'Techno', 
  'House', 
  'Trance', 
  'Psytrance', 
  'Bass', 
  'Open Format', 
  'Electronic (General)'
);

-- 2. Add genre to events
alter table events 
add column genre musical_genre not null default 'Electronic (General)';

-- 3. Add neighborhood and region to locations
alter table locations
add column neighborhood text,
add column region text default 'Fortaleza';

-- 4. Create function to check for genre/region warnings
create or replace function check_genre_region_warnings(
  p_genre musical_genre,
  p_location_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_event_id uuid default null
)
returns table (
  event_id uuid,
  title text,
  collective_name text,
  start_time timestamptz,
  end_time timestamptz,
  genre musical_genre,
  neighborhood text,
  region text
) 
language plpgsql
security definer
as $$
declare
  v_neighborhood text;
  v_region text;
begin
  -- Get region/neighborhood of the target location
  select neighborhood, region into v_neighborhood, v_region
  from locations where id = p_location_id;

  return query
  select 
    e.id as event_id,
    case 
      when e.visibility = 'Public' or e.status != 'Idea' or (select c.profile_id from collectives c where c.id = e.collective_id) = auth.uid()
      then e.title 
      else 'Reserved Slot'
    end as title,
    case 
      when e.visibility != 'Anonymous' or e.status != 'Idea' or (select c.profile_id from collectives c where c.id = e.collective_id) = auth.uid()
      then (select c.name from collectives c where c.id = e.collective_id)
      else 'Hidden Collective'
    end as collective_name,
    e.start_time,
    e.end_time,
    e.genre,
    l.neighborhood,
    l.region
  from events e
  join locations l on l.id = e.location_id
  where 
    e.genre = p_genre
    and l.region = v_region -- same region
    and (p_exclude_event_id is null or e.id != p_exclude_event_id)
    and e.start_time < p_end_time
    and e.end_time > p_start_time;
end;
$$;

-- Grant access
grant execute on function check_genre_region_warnings(musical_genre, uuid, timestamptz, timestamptz, uuid) to authenticated;
