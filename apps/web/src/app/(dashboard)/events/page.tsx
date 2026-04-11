import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { EventDashboard } from '@/components/features/events/EventDashboard';
import Link from 'next/link';

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // 1. Get collective
  const { data: collective } = await supabase
    .from('collectives')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!collective) {
    return redirect('/onboarding');
  }

  // 2. Get events with their artists
  const { data: eventsData } = await supabase
    .from('events')
    .select(`
      *,
      event_artists (
        artist_id
      )
    `)
    .eq('collective_id', collective.id)
    .order('start_time', { ascending: true });

  const events = eventsData?.map(e => ({
    ...e,
    artists: e.event_artists.map((ea: { artist_id: string }) => ea.artist_id)
  })) || [];

  // 3. Get all available artists for selection
  const { data: artists } = await supabase
    .from('artists')
    .select('id, name')
    .order('name');

  // 4. Get all locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, neighborhood, region')
    .order('name');

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto w-full border border-zinc-800 bg-zinc-950 p-8 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">Event Management</h1>
            <p className="text-xs text-zinc-500 mt-1 uppercase">Coordinate your organization&apos;s presence</p>
          </div>
          <Link href="/" className="text-xs border border-zinc-800 px-3 py-1 hover:bg-zinc-900 transition uppercase">
            Back to Home
          </Link>
        </div>

        <EventDashboard 
          initialEvents={events} 
          availableArtists={artists || []} 
          availableLocations={locations || []}
        />
      </div>
    </div>
  );
}
