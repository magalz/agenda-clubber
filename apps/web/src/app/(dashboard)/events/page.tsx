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

  // Get collective
  const { data: collective } = await supabase
    .from('collectives')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!collective) {
    return redirect('/onboarding');
  }

  // Get events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('collective_id', collective.id)
    .order('start_time', { ascending: true });

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto w-full border border-zinc-800 bg-zinc-950 p-8 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">Event Management</h1>
            <p className="text-xs text-zinc-500 mt-1 uppercase">Coordinate your organization's presence</p>
          </div>
          <Link href="/" className="text-xs border border-zinc-800 px-3 py-1 hover:bg-zinc-900 transition uppercase">
            Back to Home
          </Link>
        </div>

        <EventDashboard initialEvents={events || []} />
      </div>
    </div>
  );
}
