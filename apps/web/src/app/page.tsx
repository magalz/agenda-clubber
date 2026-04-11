import { createClient } from '@/utils/supabase/server';
import { signOut } from './(auth)/actions';
import { redirect } from 'next/navigation';
import { APP_NAME } from 'shared';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = data;

    // If authenticated but no profile, redirect to onboarding
    if (!profile) {
      return redirect('/onboarding');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-100 p-8 font-mono">
      <div className="max-w-2xl w-full border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold tracking-widest uppercase">
            {APP_NAME} <span className="text-zinc-600">v0.1.0</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-xs uppercase tracking-tighter">
              {user ? 'Authenticated' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <h2 className="text-sm font-bold mb-2 uppercase text-zinc-500">System Status</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Environment:</div>
              <div className="text-green-400">Production Ready (Dev)</div>
              <div>Database:</div>
              <div className="text-green-400">Connected (RLS Active)</div>
              <div>Auth Engine:</div>
              <div className="text-green-400">Ready (SSR)</div>
            </div>
          </div>

          {user ? (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-sm font-bold uppercase text-zinc-500">User Profile</h2>
                <div className="flex gap-2">
                  {profile?.role === 'collective' && (
                    <>
                      <Link href="/dashboard/calendar" className="text-[10px] border border-zinc-800 px-2 py-1 hover:bg-zinc-800 transition uppercase">
                        Calendar
                      </Link>
                      <Link href="/dashboard/events" className="text-[10px] border border-zinc-800 px-2 py-1 bg-zinc-100 text-black font-bold hover:bg-zinc-300 transition uppercase">
                        Events
                      </Link>
                    </>
                  )}
                  <Link href="/settings/profile" className="text-[10px] border border-zinc-800 px-2 py-1 hover:bg-zinc-800 transition uppercase">
                    Edit Profile
                  </Link>
                </div>
              </div>
              <div className="text-xs space-y-1">
                <p><span className="text-zinc-500">ID:</span> {user.id}</p>
                <p><span className="text-zinc-500">Email:</span> {user.email}</p>
                <p><span className="text-zinc-500">Username:</span> {profile?.username || 'N/A'}</p>
                <p><span className="text-zinc-500">Role:</span> {profile?.role || 'N/A'}</p>
              </div>
              <form action={signOut}>
                <button className="w-full py-2 bg-red-950 text-red-200 border border-red-900 rounded hover:bg-red-900 transition text-xs uppercase font-bold">
                  Terminate Session
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-center space-y-4">
              <p className="text-xs text-zinc-400">Faça login para gerenciar sua agenda e detectar conflitos.</p>
              <div className="flex gap-4">
                <Link href="/login" className="flex-1 py-2 bg-zinc-100 text-black rounded hover:bg-zinc-300 transition text-xs uppercase font-bold">
                  Login
                </Link>
                <Link href="/signup" className="flex-1 py-2 border border-zinc-800 rounded hover:bg-zinc-900 transition text-xs uppercase font-bold">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-600 uppercase tracking-widest">
          <span>Ignis Collective Engine</span>
          <span>© 2026 Code Clubber</span>
        </div>
      </div>
    </main>
  );
}
