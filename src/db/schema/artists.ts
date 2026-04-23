import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const artists = pgTable('artists', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => profiles.id).unique(),
    artisticName: text('artistic_name').notNull().unique(),
    location: text('location').notNull(),
    genrePrimary: text('genre_primary'),
    genreSecondary: text('genre_secondary'),
    socialLinks: jsonb('social_links'), // For SoundCloud, YouTube, Instagram
    presskitUrl: text('presskit_url'),
    releasePdfUrl: text('release_pdf_url'),
    photoUrl: text('photo_url'),
    isVerified: boolean('is_verified').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
