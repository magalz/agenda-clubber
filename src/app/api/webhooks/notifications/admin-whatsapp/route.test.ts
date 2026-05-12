import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@upstash/qstash/nextjs", () => ({
    verifySignatureAppRouter: (handler: (req: Request) => Promise<Response>) => handler,
}));

vi.mock("@/lib/evolution-api", () => ({
    sendAdminGroupMessage: vi.fn(),
    formatAdminNotificationMessage: vi.fn((type, name, timestamp) =>
        `Mock: ${type} ${name} ${timestamp} /admin`
    ),
}));

import { POST } from "./route";
import { sendAdminGroupMessage } from "@/lib/evolution-api";

function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/webhooks/notifications/admin-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/webhooks/notifications/admin-whatsapp", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("payload coletivo valido → envia notificacao e retorna 200", async () => {
        vi.mocked(sendAdminGroupMessage).mockResolvedValueOnce({ success: true });

        const res = await POST(makeRequest({
            type: "collective",
            name: "Coletivo Ignis",
            timestamp: "2026-05-12T14:30:00-03:00",
        }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ ok: true });
        expect(sendAdminGroupMessage).toHaveBeenCalledTimes(1);
        const message = vi.mocked(sendAdminGroupMessage).mock.calls[0][0];
        expect(message).toContain("Mock: collective");
        expect(message).toContain("/admin");
    });

    it("payload artista valido → envia com tipo Cadastro de Artista", async () => {
        vi.mocked(sendAdminGroupMessage).mockResolvedValueOnce({ success: true });

        await POST(makeRequest({
            type: "artist",
            name: "DJ Teste",
            timestamp: "2026-05-12T15:00:00-03:00",
        }));

        const message = vi.mocked(sendAdminGroupMessage).mock.calls[0][0];
        expect(message).toContain("Mock: artist");
        expect(message).toContain("DJ Teste");
    });

    it("payload claim valido → envia com tipo Reivindicacao de Perfil", async () => {
        vi.mocked(sendAdminGroupMessage).mockResolvedValueOnce({ success: true });

        await POST(makeRequest({
            type: "claim",
            name: "MC Exemplo",
            timestamp: "2026-05-12T16:00:00-03:00",
        }));

        const message = vi.mocked(sendAdminGroupMessage).mock.calls[0][0];
        expect(message).toContain("Mock: claim");
        expect(message).toContain("MC Exemplo");
    });

    it("payload com tipo invalido → 400", async () => {
        const res = await POST(makeRequest({
            type: "invalid_type",
            name: "Teste",
            timestamp: new Date().toISOString(),
        }));
        expect(res.status).toBe(400);
    });

    it("payload sem nome → 400", async () => {
        const res = await POST(makeRequest({
            type: "collective",
            name: "",
            timestamp: new Date().toISOString(),
        }));
        expect(res.status).toBe(400);
    });

    it("payload sem timestamp → 400", async () => {
        const res = await POST(makeRequest({
            type: "collective",
            name: "Coletivo Teste",
        }));
        expect(res.status).toBe(400);
    });

    it("sendAdminGroupMessage falha → 500 com log de erro", async () => {
        vi.mocked(sendAdminGroupMessage).mockResolvedValueOnce({ success: false, error: "Evolution offline" });

        const res = await POST(makeRequest({
            type: "collective",
            name: "Coletivo Falha",
            timestamp: new Date().toISOString(),
        }));

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("corpo JSON invalido → 400", async () => {
        const req = new Request("http://localhost/api/webhooks/notifications/admin-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ invalid json",
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
