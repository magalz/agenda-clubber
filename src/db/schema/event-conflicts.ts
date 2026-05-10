import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { events } from './events';
import { profiles } from './auth';

export const eventConflicts = pgTable('event_conflicts', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventAId: uuid('event_a_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
    eventBId: uuid('event_b_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
    rule: text('rule').notNull(),
    level: text('level', { enum: ['yellow', 'red'] }).notNull(),
    justification: text('justification').notNull(),
    status: text('status', { enum: ['open', 'a_resolved', 'b_resolved', 'consensual_agreement'] }).default('open').notNull(),
    resolvedByA: uuid('resolved_by_a').references(() => profiles.id),
    resolvedByB: uuid('resolved_by_b').references(() => profiles.id),
    resolvedAtA: timestamp('resolved_at_a', { withTimezone: true }),
    resolvedAtB: timestamp('resolved_at_b', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});
