import { Client } from "@upstash/qstash";

export const qstashClient = new Client({ token: process.env.QSTASH_TOKEN ?? "" });

type ArtistClaimInvitationPayload = {
    artistId: string;
    email: string;
    artisticName: string;
};

export async function enqueueArtistClaimInvitation(
    payload: ArtistClaimInvitationPayload
): Promise<{ queued: boolean; error?: string }> {
    if (!process.env.QSTASH_TOKEN) {
        return { queued: false, error: "QSTASH_TOKEN not configured" };
    }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        return { queued: false, error: "NEXT_PUBLIC_SITE_URL not configured" };
    }
    try {
        await qstashClient.publishJSON({
            url: new URL("/api/webhooks/notifications/artist-claim", baseUrl).toString(),
            body: payload,
        });
        return { queued: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { queued: false, error: message };
    }
}
