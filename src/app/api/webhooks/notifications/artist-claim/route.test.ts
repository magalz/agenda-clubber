import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verifySignatureAppRouter to bypass QStash signature verification in tests
vi.mock("@upstash/qstash/nextjs", () => ({
    verifySignatureAppRouter: (handler: (req: Request) => Promise<Response>) => handler,
}));

import { POST } from "./route";

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

    it("payload válido → 200 com stub:true", async () => {
        const req = makeRequest({
            artistId: "550e8400-e29b-41d4-a716-446655440000",
            email: "artista@cena.com",
            artisticName: "DJ On The Fly",
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ ok: true, stub: true });
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
