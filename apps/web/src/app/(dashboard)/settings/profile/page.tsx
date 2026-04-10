import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/features/profile/ProfileForm';
import Link from 'next/link';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100 p-8 font-mono">
      <div className="max-w-2xl mx-auto w-full border border-zinc-800 bg-zinc-950 p-8 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">Profile Settings</h1>
            <p className="text-xs text-zinc-500 mt-1 uppercase">Manage your public identity</p>
          </div>
          <Link href="/" className="text-xs border border-zinc-800 px-3 py-1 hover:bg-zinc-900 transition uppercase">
            Back
          </Link>
        </div>

        <ProfileForm initialData={profile} />
      </div>
    </div>
  );
}
