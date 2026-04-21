import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db to avoid real queries
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/db/index", () => {
    return {
        db: {
            select: (...args: unknown[]) => mockSelect(...args),
        }
    };
});

vi.mock('drizzle-orm', () => {
    return {
        eq: vi.fn(),
        ilike: vi.fn(),
    }
});

// Setting up the chain
mockSelect.mockReturnValue({ from: mockFrom });
mockFrom.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ limit: mockLimit });

import { checkDuplicateArtist } from "./actions";
import { artistOnboardingSchema, fileSchema } from "./schemas";

describe("checkDuplicateArtist", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ limit: mockLimit });
    });

    it("returns false for empty or whitespace strings without hitting db", async () => {
        expect(await checkDuplicateArtist("")).toBe(false);
        expect(await checkDuplicateArtist("   ")).toBe(false);
        expect(mockSelect).not.toHaveBeenCalled();
    });

    it("returns true if artist exists", async () => {
        mockLimit.mockResolvedValue([{ id: "123" }]);
        const result = await checkDuplicateArtist("DJ Test");
        expect(result).toBe(true);
        expect(mockSelect).toHaveBeenCalled();
    });

    it("returns false if artist does not exist", async () => {
        mockLimit.mockResolvedValue([]);
        const result = await checkDuplicateArtist("DJ Unique");
        expect(result).toBe(false);
        expect(mockSelect).toHaveBeenCalled();
    });
});

describe("artistOnboardingSchema", () => {
    const validBase = {
        artisticName: "DJ Test",
        location: "São Paulo, SP",
        genrePrimary: "Techno",
    };

    it("aceita dados válidos mínimos", () => {
        const result = artistOnboardingSchema.safeParse(validBase);
        expect(result.success).toBe(true);
    });

    it("rejeita nome com menos de 2 chars", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, artisticName: "A" });
        expect(result.success).toBe(false);
    });

    it("rejeita nome com mais de 100 chars", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, artisticName: "A".repeat(101) });
        expect(result.success).toBe(false);
    });

    it("faz trim em nome com whitespace", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, artisticName: "  DJ Test  " });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.artisticName).toBe("DJ Test");
        }
    });

    it("rejeita nome com apenas espaços (falha após trim)", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, artisticName: "   " });
        expect(result.success).toBe(false);
    });

    it("rejeita soundcloud com URL inválida", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, soundcloud: "not-a-url" });
        expect(result.success).toBe(false);
    });

    it("aceita soundcloud vazio", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, soundcloud: "" });
        expect(result.success).toBe(true);
    });

    it("aceita soundcloud com URL válida", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, soundcloud: "https://soundcloud.com/djtest" });
        expect(result.success).toBe(true);
    });
});

// Helper to create a mock File with a given size
function makeFile(name: string, type: string, sizeBytes: number): File {
    const content = new Uint8Array(sizeBytes);
    return new File([content], name, { type });
}

describe("fileSchema", () => {
    it("aceita foto JPEG válida (<5MB)", () => {
        const result = fileSchema.safeParse({
            photo: makeFile("photo.jpg", "image/jpeg", 1024),
            releasePdf: null,
        });
        expect(result.success).toBe(true);
    });

    it("aceita foto PNG válida", () => {
        const result = fileSchema.safeParse({
            photo: makeFile("photo.png", "image/png", 1024),
            releasePdf: null,
        });
        expect(result.success).toBe(true);
    });

    it("rejeita foto com tipo inválido (GIF)", () => {
        const result = fileSchema.safeParse({
            photo: makeFile("photo.gif", "image/gif", 1024),
            releasePdf: null,
        });
        expect(result.success).toBe(false);
    });

    it("rejeita foto >5MB", () => {
        const result = fileSchema.safeParse({
            photo: makeFile("photo.jpg", "image/jpeg", 6 * 1024 * 1024),
            releasePdf: null,
        });
        expect(result.success).toBe(false);
    });

    it("aceita PDF válido (<20MB)", () => {
        const result = fileSchema.safeParse({
            photo: null,
            releasePdf: makeFile("release.pdf", "application/pdf", 1024),
        });
        expect(result.success).toBe(true);
    });

    it("rejeita PDF com tipo inválido", () => {
        const result = fileSchema.safeParse({
            photo: null,
            releasePdf: makeFile("release.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1024),
        });
        expect(result.success).toBe(false);
    });

    it("rejeita PDF >20MB", () => {
        const result = fileSchema.safeParse({
            photo: null,
            releasePdf: makeFile("release.pdf", "application/pdf", 21 * 1024 * 1024),
        });
        expect(result.success).toBe(false);
    });

    it("aceita ambos null (nenhum upload)", () => {
        const result = fileSchema.safeParse({
            photo: null,
            releasePdf: null,
        });
        expect(result.success).toBe(true);
    });
});
