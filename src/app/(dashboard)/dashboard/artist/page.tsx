import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { artists } from "@/db/schema/artists";
import { profiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

async function getArtistStatus(userId: string): Promise<string | null> {
    try {
        const result = await db
            .select({ status: artists.status })
            .from(artists)
            .innerJoin(profiles, eq(profiles.id, artists.profileId))
            .where(eq(profiles.userId, userId))
            .limit(1);
        return result[0]?.status ?? null;
    } catch {
        return null;
    }
}

export default async function ArtistDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const status = user ? await getArtistStatus(user.id) : null;

    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
            {status === 'pending_approval' && (
                <div className="max-w-md w-full rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
                    <p className="font-medium">Perfil aguardando aprovação</p>
                    <p className="mt-0.5 text-yellow-600/80 dark:text-yellow-400/80">
                        Seu perfil foi enviado e está sendo revisado pelos administradores da plataforma. Você receberá uma confirmação em breve.
                    </p>
                </div>
            )}
            <h1 className="text-3xl font-bold">Dashboard do Artista</h1>
            {/* V1 dashboard contents go here in future epics */}
        </div>
    );
}
