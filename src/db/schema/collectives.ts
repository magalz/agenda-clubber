import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const collectives = pgTable('collectives', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    location: text('location').notNull(),
    logoUrl: text('logo_url'),
    description: text('description'),
    genrePrimary: text('genre_primary').notNull(),
    genreSecondary: text('genre_secondary'),
    socialLinks: jsonb('social_links'), // For soundcloud, youtube, instagram
    status: text('status', { enum: ['pending', 'active', 'rejected'] }).default('pending').notNull(),
    ownerId: uuid('owner_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(), // Initial creator
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});
