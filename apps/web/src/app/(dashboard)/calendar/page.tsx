import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarView } from '@/components/features/calendar/CalendarView';
import Link from 'next/link';

export default async function CalendarDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100 p-8 font-mono">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-zinc-100">Scene Calendar</h1>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Global visibility & strategic coordination</p>
          </div>
          <Link href="/" className="text-xs border border-zinc-800 px-3 py-1 hover:bg-zinc-900 transition uppercase">
            Back to Dashboard
          </Link>
        </div>

        <div className="h-[calc(100vh-200px)]">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}
