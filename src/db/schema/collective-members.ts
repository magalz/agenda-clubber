import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { profiles } from './auth';
import { collectives } from './collectives';

export const collectiveMembers = pgTable('collective_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    collectiveId: uuid('collective_id').references(() => collectives.id, { onDelete: 'cascade' }).notNull(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').default('member').notNull(), // 'collective_admin', 'member'
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMembership: uniqueIndex('collective_members_unique_membership').on(table.collectiveId, table.profileId),
}));
