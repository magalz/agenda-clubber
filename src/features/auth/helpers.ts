"use server";

import { db } from "@/db/index";
import { profiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

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
