import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPublishJSON = vi.hoisted(() => vi.fn());

vi.mock("@upstash/qstash", () => ({
    Client: class { publishJSON = mockPublishJSON },
}));

import { enqueueAdminWhatsAppNotification } from "./qstash";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
        ...ORIGINAL_ENV,
        QSTASH_TOKEN: "test-qstash-token",
        NEXT_PUBLIC_SITE_URL: "https://agendaclubber.com",
    };
});

afterEach(() => {
    process.env = ORIGINAL_ENV;
});

describe("enqueueAdminWhatsAppNotification", () => {
    it("publica no QStash com URL e payload corretos", async () => {
        mockPublishJSON.mockResolvedValueOnce({ messageId: "msg-123" });

        const result = await enqueueAdminWhatsAppNotification({
            type: "collective",
            name: "Coletivo Ignis",
            timestamp: "2026-05-12T14:30:00-03:00",
        });

        expect(result.queued).toBe(true);
        expect(mockPublishJSON).toHaveBeenCalledWith({
            url: "https://agendaclubber.com/api/webhooks/notifications/admin-whatsapp",
            body: {
                type: "collective",
                name: "Coletivo Ignis",
                timestamp: "2026-05-12T14:30:00-03:00",
            },
        });
    });

    it("retorna erro se QSTASH_TOKEN nao configurado", async () => {
        delete process.env.QSTASH_TOKEN;

        const result = await enqueueAdminWhatsAppNotification({
            type: "artist",
            name: "DJ Teste",
            timestamp: new Date().toISOString(),
        });

        expect(result.queued).toBe(false);
        expect(result.error).toContain("QSTASH_TOKEN");
    });

    it("retorna erro se NEXT_PUBLIC_SITE_URL nao configurado", async () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;

        const result = await enqueueAdminWhatsAppNotification({
            type: "claim",
            name: "MC Exemplo",
            timestamp: new Date().toISOString(),
        });

        expect(result.queued).toBe(false);
        expect(result.error).toContain("SITE_URL");
    });

    it("retorna erro se QStash publishJSON falhar", async () => {
        mockPublishJSON.mockRejectedValueOnce(new Error("QStash timeout"));

        const result = await enqueueAdminWhatsAppNotification({
            type: "collective",
            name: "Coletivo Falha",
            timestamp: new Date().toISOString(),
        });

        expect(result.queued).toBe(false);
        expect(result.error).toBe("QStash timeout");
    });
});
