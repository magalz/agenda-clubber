-- Fix RLS Policies for Profiles, Collectives and Artists

-- 1. Allow users to insert their own profile
create policy "Users can insert their own profile"
on profiles for insert
with check ( auth.uid() = id );

-- 2. Fix collectives policy (was recursive/missing insert)
drop policy if exists "Collective owners can manage their data" on collectives;

create policy "Users can insert their own collective"
on collectives for insert
with check ( auth.uid() = profile_id );

create policy "Users can manage their own collective"
on collectives for all
using ( auth.uid() = profile_id );

-- 3. Ensure artists policy covers insert correctly
drop policy if exists "Artists can manage their own data" on artists;

create policy "Users can manage their own artist profile"
on artists for all
using ( auth.uid() = profile_id )
with check ( auth.uid() = profile_id );
