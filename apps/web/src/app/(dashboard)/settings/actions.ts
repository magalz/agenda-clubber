'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const username = formData.get('username') as string;
  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  // 1. Update Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      username,
      bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  // 2. Sync with role-specific tables
  if (profile.role === 'collective') {
    await supabase
      .from('collectives')
      .update({
        name: username,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', user.id);
  } else if (profile.role === 'artist') {
    await supabase
      .from('artists')
      .update({
        name: username,
        bio: bio,
        avatar_url: avatarUrl,
        slug: username.toLowerCase().replace(/\s+/g, '-'),
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', user.id);
  }

  revalidatePath('/settings/profile');
  revalidatePath('/');
  return { success: true };
}
