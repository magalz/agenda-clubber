'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VALIDATION } from 'shared';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/(dashboard)/settings/actions';

const profileSchema = z.object({
  username: z.string().min(VALIDATION.USERNAME_MIN_LENGTH, `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`),
  bio: z.string().max(VALIDATION.BIO_MAX_LENGTH, `Bio must be at most ${VALIDATION.BIO_MAX_LENGTH} characters`).optional(),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    id: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialData.username,
      bio: initialData.bio || '',
      avatarUrl: initialData.avatar_url || '',
    },
  });

  const avatarUrl = watch('avatarUrl');

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const fileExt = file.name.split('.').pop();
    const filePath = `${initialData.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      setMessage({ type: 'error', text: 'Error uploading avatar: ' + uploadError.message });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setValue('avatarUrl', publicUrl);
    setIsUploading(false);
  }

  async function onSubmit(data: ProfileFormValues) {
    setMessage(null);
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('bio', data.bio || '');
    formData.append('avatarUrl', data.avatarUrl || '');

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-32 w-32 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-zinc-600">No Image</span>
          )}
        </div>
        <div>
          <label className="cursor-pointer inline-flex items-center rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300">
            {isUploading ? 'Uploading...' : 'Upload Avatar'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-bold uppercase text-zinc-500">Username</label>
          <input
            {...register('username')}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-700"
          />
          {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-bold uppercase text-zinc-500">Bio</label>
          <textarea
            {...register('bio')}
            rows={4}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-700 resize-none"
          />
          {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
        </div>

        {message && (
          <div className={`p-4 rounded border text-sm text-center ${
            message.type === 'success' ? 'bg-green-950 border-green-900 text-green-200' : 'bg-red-950 border-red-900 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-zinc-100 py-3 font-bold text-black transition hover:bg-zinc-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
