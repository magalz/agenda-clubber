"use server";

import { db } from "@/db/index";
import { profiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/features/artists/visibility";

/**
 * Checks if the Supabase auth user (by userId) has the 'admin' platform role.
 * Note: 'admin' is not yet in the profiles.role enum (Story 5.1 will add it).
 * This helper returns false for all users until admin seeding is implemented.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
    try {
        const result = await db
            .select({ role: profiles.role })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);
        // @ts-expect-error role enum doesn't include 'admin' yet (Story 5.1)
        return result.length > 0 && result[0].role === 'admin';
    } catch {
        return false;
    }
}

/**
 * Resolves the current request's viewer context for use in public profile rendering.
 * Reads the Supabase session cookie; unauthenticated requests return { kind: 'anon' }.
 */
export async function getViewerContext(): Promise<Viewer> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { kind: "anon" };

    try {
        const result = await db
            .select({ id: profiles.id, role: profiles.role })
            .from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1);

        if (!result.length) return { kind: "anon" };

        const { id: profileId, role } = result[0];
        const isAdmin = await isPlatformAdmin(user.id);

        return { kind: "authenticated", role, profileId, isAdmin };
    } catch {
        return { kind: "anon" };
    }
}
