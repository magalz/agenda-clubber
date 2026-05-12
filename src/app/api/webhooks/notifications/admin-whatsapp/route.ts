import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { sendAdminGroupMessage, formatAdminNotificationMessage } from "@/lib/evolution-api";

const payloadSchema = z.object({
    type: z.enum(["collective", "artist", "claim"]),
    name: z.string().min(2),
    timestamp: z.string(),
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

    const { type, name, timestamp } = parsed.data;
    const message = formatAdminNotificationMessage(type, name, timestamp);

    const result = await sendAdminGroupMessage(message);
    if (!result.success) {
        console.error("[admin-whatsapp] Failed to send notification", {
            error: result.error,
            type,
            name,
        });
        return Response.json({ ok: false, error: result.error }, { status: 500 });
    }

    console.info("[admin-whatsapp] Notification sent", { type, name });
    return Response.json({ ok: true });
}

export async function POST(req: Request) {
    return verifySignatureAppRouter(handler)(req);
}
