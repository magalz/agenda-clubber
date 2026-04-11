-- Refine Event Visibility Policies

-- 1. Redefine Select Policy for Events
drop policy if exists "Public and non-Idea events are viewable by everyone" on events;

-- 1.1 Show everything to everyone (for conflict detection)
-- But we will use the VIEW for UI to mask details
create policy "All events are viewable by everyone"
on events for select
using ( true );

-- Note: RLS in Supabase (Postgres) is all-or-nothing for a row.
-- To achieve "Field-level RLS" (masking), we usually use a View or handle it in the application layer.
-- Since we want to stick to a robust architecture, we will implement a VIEW for the Public Calendar.

-- 2. Create a secure view for the Public Calendar
create or replace view public_events as
select
  id,
  case 
    when visibility = 'Public' or status != 'Idea' or (select profile_id from collectives where id = collective_id) = auth.uid()
    then title 
    else 'Reserved Slot'
  end as title,
  case 
    when visibility = 'Public' or status != 'Idea' or (select profile_id from collectives where id = collective_id) = auth.uid()
    then collective_id 
    else null
  end as collective_id,
  status,
  visibility,
  start_time,
  end_time,
  location_id,
  created_at
from events
where 
  visibility != 'Anonymous' 
  or status != 'Idea' 
  or (select profile_id from collectives where id = collective_id) = auth.uid();

-- Grant access to the view
grant select on public_events to authenticated, anon;
