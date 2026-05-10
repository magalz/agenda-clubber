import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { sendArtistClaimInvitation } from "@/lib/resend";

const payloadSchema = z.object({
    artistId: z.string().uuid(),
    email: z.string().email(),
    artisticName: z.string().min(2),
});

async function handler(req: Request) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { email, artisticName } = parsed.data;

    const result = await sendArtistClaimInvitation(email, artisticName);
    if (!result.sent) {
        console.error("[artist-claim-invitation] Failed to send email", {
            error: result.error,
            email,
            artisticName,
        });
        return Response.json({ ok: false, error: result.error }, { status: 500 });
    }

    console.info("[artist-claim-invitation] Email sent", { email, artisticName });
    return Response.json({ ok: true });
}

export async function POST(req: Request) {
    return verifySignatureAppRouter(handler)(req);
}
