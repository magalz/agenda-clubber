import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './auth';
import { collectives } from './collectives';

export const collectiveMembers = pgTable('collective_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    collectiveId: uuid('collective_id').references(() => collectives.id).notNull(),
    profileId: uuid('profile_id').references(() => profiles.id).notNull(),
    role: text('role').default('member').notNull(), // 'admin', 'member'
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
});
