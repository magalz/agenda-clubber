import 'server-only';

import { db } from '@/db/index';
import { collectiveMembers } from '@/db/schema/collective-members';
import { collectives } from '@/db/schema/collectives';
import { and, eq, desc } from 'drizzle-orm';
import { getViewerContext } from '@/features/auth/helpers';

/**
 * Returns the ID of the first **active** collective the current user is a member of.
 *
 * - Filters by `collectives.status = 'active'` (pending/rejected collectives are excluded).
 * - `collective_members` has no `status` column — status lives on `collectives`.
 * - Multi-collective MVP: returns the first match (Story 5.x will add multi-collective support).
 *
 * @returns collective UUID or null if anon, no profile, no membership, or only pending/rejected.
 */
export async function getCurrentUserCollectiveId(): Promise<string | null> {
    const viewer = await getViewerContext();
    if (viewer.kind !== 'authenticated') return null;

    const rows = await db
        .select({ collectiveId: collectives.id })
        .from(collectiveMembers)
        .innerJoin(collectives, eq(collectives.id, collectiveMembers.collectiveId))
        .where(
            and(
                eq(collectiveMembers.profileId, viewer.profileId),
                eq(collectives.status, 'active')
            )
        )
        .orderBy(desc(collectives.createdAt))
        .limit(1);

    return rows[0]?.collectiveId ?? null;
}

/**
 * Returns the first collective the viewer is a member of, **regardless of status**.
 *
 * Used to distinguish "no collective at all" from "has a collective but it's pending/rejected"
 * so the UI can render the appropriate empty-state vs approval-pending banner.
 */
export async function getCurrentUserCollective(): Promise<
    { id: string; status: 'pending_approval' | 'active' | 'rejected' } | null
> {
    const viewer = await getViewerContext();
    if (viewer.kind !== 'authenticated') return null;

    const rows = await db
        .select({ id: collectives.id, status: collectives.status })
        .from(collectiveMembers)
        .innerJoin(collectives, eq(collectives.id, collectiveMembers.collectiveId))
        .where(eq(collectiveMembers.profileId, viewer.profileId))
        .orderBy(desc(collectives.createdAt))
        .limit(1);

    return rows[0] ?? null;
}
