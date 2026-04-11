-- Function to check for artist conflicts
-- Returns conflicting events for a list of artists in a date range

create or replace function check_artist_conflicts(
  p_artist_ids uuid[],
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
  visibility event_visibility,
  status event_status,
  artist_id uuid,
  artist_name text
) 
language plpgsql
security definer
as $$
begin
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
    e.visibility,
    e.status,
    ea.artist_id,
    a.name as artist_name
  from events e
  join event_artists ea on ea.event_id = e.id
  join artists a on a.id = ea.artist_id
  where 
    ea.artist_id = any(p_artist_ids)
    and (p_exclude_event_id is null or e.id != p_exclude_event_id)
    and e.start_time < p_end_time
    and e.end_time > p_start_time;
end;
$$;

-- Grant access to the function
grant execute on function check_artist_conflicts(uuid[], timestamptz, timestamptz, uuid) to authenticated;
