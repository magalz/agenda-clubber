import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── DB mocks ────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock("@/db/index", () => ({
    db: {
        select: (...args: unknown[]) => mockSelect(...args),
        insert: (...args: unknown[]) => mockInsert(...args),
    },
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn(),
    ilike: vi.fn(),
    and: vi.fn(),
}));

// ─── Supabase mock ───────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    }),
}));

// ─── QStash mock ─────────────────────────────────────────────────────────────
const mockEnqueueArtistClaimInvitation = vi.fn();
vi.mock("@/features/notifications/qstash", () => ({
    enqueueArtistClaimInvitation: (...args: unknown[]) => mockEnqueueArtistClaimInvitation(...args),
}));

// ─── Chain helpers ────────────────────────────────────────────────────────────
function setupSelectChain() {
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ from: mockFrom });
}

function setupInsertChain(returnedId = "artist-uuid-123") {
    mockReturning.mockResolvedValue([{ id: returnedId }]);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
}

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { checkDuplicateArtist, createOnTheFlyArtistAction } from "./actions";
import { artistOnboardingSchema, fileSchema, createOnTheFlyArtistSchema } from "./schemas";

// ─────────────────────────────────────────────────────────────────────────────
// checkDuplicateArtist
// ─────────────────────────────────────────────────────────────────────────────
describe("checkDuplicateArtist", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
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

// ─────────────────────────────────────────────────────────────────────────────
// artistOnboardingSchema
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// createOnTheFlyArtistSchema
// ─────────────────────────────────────────────────────────────────────────────
describe("createOnTheFlyArtistSchema", () => {
    const validBase = { artisticName: "DJ On The Fly", location: "Recife, PE" };

    it("aceita dados mínimos sem e-mail", () => {
        expect(createOnTheFlyArtistSchema.safeParse(validBase).success).toBe(true);
    });

    it("aceita dados com e-mail válido", () => {
        expect(createOnTheFlyArtistSchema.safeParse({ ...validBase, email: "dj@cena.com" }).success).toBe(true);
    });

    it("aceita e-mail vazio (string vazia)", () => {
        expect(createOnTheFlyArtistSchema.safeParse({ ...validBase, email: "" }).success).toBe(true);
    });

    it("rejeita e-mail inválido", () => {
        expect(createOnTheFlyArtistSchema.safeParse({ ...validBase, email: "not-an-email" }).success).toBe(false);
    });

    it("rejeita nome com menos de 2 chars", () => {
        const result = createOnTheFlyArtistSchema.safeParse({ ...validBase, artisticName: "A" });
        expect(result.success).toBe(false);
    });

    it("faz trim no nome", () => {
        const result = createOnTheFlyArtistSchema.safeParse({ ...validBase, artisticName: "  DJ Trim  " });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.artisticName).toBe("DJ Trim");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// fileSchema
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// createOnTheFlyArtistAction
// ─────────────────────────────────────────────────────────────────────────────
describe("createOnTheFlyArtistAction", () => {
    const ARTIST_ID = "artist-uuid-123";
    const INITIAL_STATE = { data: null, error: null } as const;

    function makeFormData(overrides: Record<string, string> = {}): FormData {
        const fd = new FormData();
        fd.set("artisticName", "DJ On The Fly");
        fd.set("location", "São Paulo, SP");
        Object.entries(overrides).forEach(([k, v]) => fd.set(k, v));
        return fd;
    }

    function setupAuthenticatedUser() {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
    }

    function setupAdminCheck(isAdmin: boolean) {
        mockLimit.mockResolvedValueOnce(isAdmin ? [{ id: "admin-member-id" }] : []);
    }

    function setupDuplicateCheck(isDuplicate: boolean) {
        mockLimit.mockResolvedValueOnce(isDuplicate ? [{ id: "existing-artist-id" }] : []);
    }

    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
        setupInsertChain(ARTIST_ID);
        mockEnqueueArtistClaimInvitation.mockResolvedValue({ queued: true });
    });

    it("happy path com e-mail → emailQueued true, artista com profileId=null e genrePrimary=null", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(true);
        setupDuplicateCheck(false);

        const result = await createOnTheFlyArtistAction(
            INITIAL_STATE,
            makeFormData({ email: "artista@cena.com" })
        );

        expect(result.error).toBeNull();
        expect(result.data?.success).toBe(true);
        expect(result.data?.artistId).toBe(ARTIST_ID);
        expect(result.data?.emailQueued).toBe(true);
        expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
            profileId: null,
            isVerified: false,
            genrePrimary: null,
            artisticName: "DJ On The Fly",
        }));
        expect(mockEnqueueArtistClaimInvitation).toHaveBeenCalledWith(expect.objectContaining({
            artistId: ARTIST_ID,
            email: "artista@cena.com",
        }));
    });

    it("happy path sem e-mail → emailQueued false, sem chamada ao QStash", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(true);
        setupDuplicateCheck(false);

        const result = await createOnTheFlyArtistAction(INITIAL_STATE, makeFormData());

        expect(result.error).toBeNull();
        expect(result.data?.emailQueued).toBe(false);
        expect(mockEnqueueArtistClaimInvitation).not.toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
    });

    it("nome < 2 chars → VALIDATION_ERROR com fieldErrors.artisticName", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(true);

        const result = await createOnTheFlyArtistAction(
            INITIAL_STATE,
            makeFormData({ artisticName: "A" })
        );

        expect(result.error?.code).toBe("VALIDATION_ERROR");
        expect(result.error?.fieldErrors?.artisticName).toBeDefined();
        expect(mockInsert).not.toHaveBeenCalled();
        expect(mockEnqueueArtistClaimInvitation).not.toHaveBeenCalled();
    });

    it("nome duplicado → DUPLICATE_NAME, sem insert, sem enqueue", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(true);
        setupDuplicateCheck(true);

        const result = await createOnTheFlyArtistAction(INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("DUPLICATE_NAME");
        expect(mockInsert).not.toHaveBeenCalled();
        expect(mockEnqueueArtistClaimInvitation).not.toHaveBeenCalled();
    });

    it("sem autenticação → UNAUTHORIZED", async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("not authenticated") });

        const result = await createOnTheFlyArtistAction(INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("UNAUTHORIZED");
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it("user sem collective_admin em coletivo → FORBIDDEN", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(false);

        const result = await createOnTheFlyArtistAction(INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("FORBIDDEN");
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it("falha de enqueue → insert persiste, retorna emailQueued false", async () => {
        setupAuthenticatedUser();
        setupAdminCheck(true);
        setupDuplicateCheck(false);
        mockEnqueueArtistClaimInvitation.mockResolvedValue({ queued: false, error: "QStash timeout" });

        const result = await createOnTheFlyArtistAction(
            INITIAL_STATE,
            makeFormData({ email: "artista@cena.com" })
        );

        expect(result.error).toBeNull();
        expect(result.data?.success).toBe(true);
        expect(result.data?.emailQueued).toBe(false);
        expect(mockInsert).toHaveBeenCalled();
    });
});
