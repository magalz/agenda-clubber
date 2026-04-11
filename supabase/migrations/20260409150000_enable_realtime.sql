-- Enable Realtime for the events table
-- This allows clients to subscribe to changes (INSERT, UPDATE, DELETE)

alter publication supabase_realtime add table events;
