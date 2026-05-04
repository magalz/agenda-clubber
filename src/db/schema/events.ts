import { pgTable, text, timestamp, uuid, jsonb, date, numeric, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './auth';
import { collectives } from './collectives';

export const events = pgTable('events', {
    id: uuid('id').defaultRandom().primaryKey(),
    collectiveId: uuid('collective_id').references(() => collectives.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    eventDate: date('event_date').notNull(),
    eventDateUtc: timestamp('event_date_utc', { withTimezone: true }).notNull(),
    locationName: text('location_name').notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    timezone: text('timezone'),
    genrePrimary: text('genre_primary').notNull(),
    lineup: jsonb('lineup'),
    status: text('status', { enum: ['planning', 'confirmed'] }).default('planning').notNull(),
    isNamePublic: boolean('is_name_public').default(true).notNull(),
    isLocationPublic: boolean('is_location_public').default(false).notNull(),
    isLineupPublic: boolean('is_lineup_public').default(false).notNull(),
    conflictLevel: text('conflict_level', { enum: ['green', 'yellow', 'red'] }),
    conflictJustification: text('conflict_justification'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});
