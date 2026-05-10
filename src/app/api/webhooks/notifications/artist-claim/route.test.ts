import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verifySignatureAppRouter to bypass QStash signature verification in tests
vi.mock("@upstash/qstash/nextjs", () => ({
    verifySignatureAppRouter: (handler: (req: Request) => Promise<Response>) => handler,
}));

vi.mock("@/lib/resend", () => ({
    sendArtistClaimInvitation: vi.fn(),
}));

import { POST } from "./route";
import { sendArtistClaimInvitation } from "@/lib/resend";

describe("POST /api/webhooks/notifications/artist-claim", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function makeRequest(body: unknown): Request {
        return new Request("http://localhost/api/webhooks/notifications/artist-claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    }

    it("payload válido → envia email e retorna 200", async () => {
        vi.mocked(sendArtistClaimInvitation).mockResolvedValueOnce({ sent: true });

        const req = makeRequest({
            artistId: "550e8400-e29b-41d4-a716-446655440000",
            email: "artista@cena.com",
            artisticName: "DJ On The Fly",
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ ok: true });
        expect(sendArtistClaimInvitation).toHaveBeenCalledWith("artista@cena.com", "DJ On The Fly");
    });

    it("falha no Resend → 500", async () => {
        vi.mocked(sendArtistClaimInvitation).mockResolvedValueOnce({ sent: false, error: "Resend error" });

        const req = makeRequest({
            artistId: "550e8400-e29b-41d4-a716-446655440000",
            email: "artista@cena.com",
            artisticName: "DJ On The Fly",
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json).toEqual({ ok: false, error: "Resend error" });
    });

    it("payload com artistId inválido (não-uuid) → 400", async () => {
        const req = makeRequest({
            artistId: "not-a-uuid",
            email: "artista@cena.com",
            artisticName: "DJ On The Fly",
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("payload com e-mail inválido → 400", async () => {
        const req = makeRequest({
            artistId: "550e8400-e29b-41d4-a716-446655440000",
            email: "not-an-email",
            artisticName: "DJ On The Fly",
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("payload sem campos obrigatórios → 400", async () => {
        const req = makeRequest({ artisticName: "DJ On The Fly" });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("corpo JSON inválido → 400", async () => {
        const req = new Request("http://localhost/api/webhooks/notifications/artist-claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ invalid json",
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
