import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";

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

    console.info("[artist-claim-invitation]", {
        category: "artist-claim-invitation",
        data: parsed.data,
    });

    // TODO(story-2.x): replace stub with Resend/transactional provider integration
    return Response.json({ ok: true, stub: true });
}

export async function POST(req: Request) {
    return verifySignatureAppRouter(handler)(req);
}
