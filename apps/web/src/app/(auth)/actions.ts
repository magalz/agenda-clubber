'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?message=Could not authenticate user: ${error.message}`);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/signup?message=Could not create user: ${error.message}`);
  }

  return redirect('/signup?message=Check your email for confirmation link');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const role = formData.get('role') as 'collective' | 'artist';
  const username = formData.get('username') as string;

  // 1. Create Profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role,
    username,
  });

  if (profileError) {
    return redirect(`/onboarding?message=Error creating profile: ${profileError.message}`);
  }

  // 2. Create Role-Specific Record
  if (role === 'collective') {
    const { error: collectiveError } = await supabase.from('collectives').insert({
      profile_id: user.id,
      name: username, // Default name to username
    });
    if (collectiveError) console.error('Error creating collective:', collectiveError);
  } else {
    const { error: artistError } = await supabase.from('artists').insert({
      profile_id: user.id,
      name: username, // Default name to username
      slug: username.toLowerCase().replace(/\s+/g, '-'),
    });
    if (artistError) console.error('Error creating artist:', artistError);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
