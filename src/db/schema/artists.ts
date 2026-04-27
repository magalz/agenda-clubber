import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './auth';
import type { ArtistPrivacySettings } from '@/features/artists/types';

export const artists = pgTable('artists', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => profiles.id).unique(),
    artisticName: text('artistic_name').notNull().unique(),
    location: text('location').notNull(),
    genrePrimary: text('genre_primary'),
    genreSecondary: text('genre_secondary'),
    bio: text('bio'),
    socialLinks: jsonb('social_links'), // For SoundCloud, YouTube, Instagram
    presskitUrl: text('presskit_url'),
    releasePdfUrl: text('release_pdf_url'),
    photoUrl: text('photo_url'),
    isVerified: boolean('is_verified').default(false).notNull(),
    status: text('status', { enum: ['pending_approval', 'approved', 'rejected'] })
        .default('pending_approval').notNull(),
    privacySettings: jsonb('privacy_settings').$type<ArtistPrivacySettings>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
