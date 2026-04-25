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
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock("@/db/index", () => ({
    db: {
        select: (...args: unknown[]) => mockSelect(...args),
        insert: (...args: unknown[]) => mockInsert(...args),
        update: (...args: unknown[]) => mockUpdate(...args),
    },
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn(),
    ilike: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn(),
    not: vi.fn(),
    or: vi.fn(),
    sql: vi.fn(),
}));

// ─── Supabase mock ───────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
const mockStorageFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
        storage: {
            from: (...args: unknown[]) => mockStorageFrom(...args),
        },
    }),
}));

// ─── next/navigation mock ─────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
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

function setupUpdateChain(rowCount = 1) {
    mockUpdateWhere.mockResolvedValue({ rowCount });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
}

function setupStorage() {
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://storage.example.com/photo.jpg" } });
    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockStorageFrom.mockReturnValue({
        upload: mockStorageUpload,
        remove: mockStorageRemove,
        getPublicUrl: mockStorageGetPublicUrl,
    });
}

// ─── Imports after mocks ──────────────────────────────────────────────────────
import {
    checkDuplicateArtist,
    createOnTheFlyArtistAction,
    searchRestrictedArtistByName,
    claimArtistProfileAction,
    saveArtistOnboardingAction,
} from "./actions";
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

    it("aceita bio opcional", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, bio: "Sou um DJ de techno de São Paulo." });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.bio).toBe("Sou um DJ de techno de São Paulo.");
        }
    });

    it("rejeita bio maior que 2000 chars", () => {
        const result = artistOnboardingSchema.safeParse({ ...validBase, bio: "A".repeat(2001) });
        expect(result.success).toBe(false);
    });

    it("aplica privacySettings default quando não enviado", () => {
        const result = artistOnboardingSchema.safeParse(validBase);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.privacySettings?.mode).toBe('public');
        }
    });

    it("aceita privacySettings como JSON string", () => {
        const privacy = JSON.stringify({ mode: 'private', fields: { social_links: 'private', presskit: 'private', bio: 'private', genre: 'private' } });
        const result = artistOnboardingSchema.safeParse({ ...validBase, privacySettings: privacy });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.privacySettings?.mode).toBe('private');
        }
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
            status: 'approved',
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

// ─────────────────────────────────────────────────────────────────────────────
// searchRestrictedArtistByName
// ─────────────────────────────────────────────────────────────────────────────
describe("searchRestrictedArtistByName", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
    });

    it("nome vazio → VALIDATION_ERROR", async () => {
        const result = await searchRestrictedArtistByName("");
        expect(result.error?.code).toBe("VALIDATION_ERROR");
        expect(result.data).toBeNull();
    });

    it("nome com 1 char → VALIDATION_ERROR", async () => {
        const result = await searchRestrictedArtistByName("A");
        expect(result.error?.code).toBe("VALIDATION_ERROR");
        expect(result.data).toBeNull();
    });

    it("nome match com profile_id IS NULL e status=approved → retorna hit", async () => {
        const hit = { id: "artist-1", artisticName: "Test DJ", location: "SP", genrePrimary: "Techno", photoUrl: null };
        // First call: restrictedHit; Second call: conflictCheck
        mockLimit.mockResolvedValueOnce([hit]);
        mockLimit.mockResolvedValueOnce([]);

        const result = await searchRestrictedArtistByName("Test DJ");

        expect(result.error).toBeNull();
        expect(result.data?.hit).toEqual(hit);
        expect(result.data?.conflict).toBe(false);
    });

    it("nome match com profile_id != null (já reivindicado) → hit=null, conflict=true", async () => {
        // First call: restrictedHit (empty — profile_id IS NULL filter); Second call: conflictCheck (has one)
        mockLimit.mockResolvedValueOnce([]);
        mockLimit.mockResolvedValueOnce([{ id: "artist-2" }]);

        const result = await searchRestrictedArtistByName("Claimed DJ");

        expect(result.error).toBeNull();
        expect(result.data?.hit).toBeNull();
        expect(result.data?.conflict).toBe(true);
    });

    it("sem match de nenhum tipo → hit=null, conflict=false", async () => {
        mockLimit.mockResolvedValueOnce([]);
        mockLimit.mockResolvedValueOnce([]);

        const result = await searchRestrictedArtistByName("Nobody");

        expect(result.error).toBeNull();
        expect(result.data?.hit).toBeNull();
        expect(result.data?.conflict).toBe(false);
    });

    it("erro de DB → DB_ERROR", async () => {
        mockSelect.mockImplementation(() => { throw new Error("Connection failed"); });

        const result = await searchRestrictedArtistByName("Test DJ");

        expect(result.error?.code).toBe("DB_ERROR");
        expect(result.data).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// claimArtistProfileAction
// ─────────────────────────────────────────────────────────────────────────────
describe("claimArtistProfileAction", () => {
    const ARTIST_ID = "artist-uuid-to-claim";
    const INITIAL_STATE = { data: null, error: null } as const;

    function makeFormData(overrides: Record<string, string> = {}): FormData {
        const fd = new FormData();
        fd.set("genrePrimary", "Techno");
        Object.entries(overrides).forEach(([k, v]) => fd.set(k, v));
        return fd;
    }

    function setupAuthenticatedArtist() {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
        // Profile query: returns artista role
        mockLimit.mockResolvedValueOnce([{ id: "profile-uuid", role: "artista" }]);
    }

    function setupArtistRecord(overrides: { profileId?: string | null; status?: string } = {}) {
        const record = {
            id: ARTIST_ID,
            profileId: overrides.profileId ?? null,
            status: overrides.status ?? 'approved',
        };
        mockLimit.mockResolvedValueOnce([record]);
    }

    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
        setupUpdateChain(1);
        setupStorage();
    });

    it("sem autenticação → UNAUTHORIZED", async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no auth") });

        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("UNAUTHORIZED");
    });

    it("user com role produtor → FORBIDDEN", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
        mockLimit.mockResolvedValueOnce([{ id: "profile-uuid", role: "produtor" }]);

        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("artista não encontrado → NOT_FOUND", async () => {
        setupAuthenticatedArtist();
        mockLimit.mockResolvedValueOnce([]); // artist not found

        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("artista já reivindicado → ALREADY_CLAIMED", async () => {
        setupAuthenticatedArtist();
        setupArtistRecord({ profileId: "another-profile-id" });

        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("ALREADY_CLAIMED");
    });

    it("artista com status != approved → NOT_CLAIMABLE", async () => {
        setupAuthenticatedArtist();
        setupArtistRecord({ profileId: null, status: 'pending_approval' });

        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());

        expect(result.error?.code).toBe("NOT_CLAIMABLE");
    });

    it("sucesso → status='pending_approval', profile_id gravado", async () => {
        setupAuthenticatedArtist();
        setupArtistRecord();

        try {
            await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, makeFormData());
        } catch {
            // redirect() throws NEXT_REDIRECT — expected
        }

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            profileId: "profile-uuid",
            status: 'pending_approval',
        }));
    });

    it("dados de formulário inválidos → VALIDATION_ERROR", async () => {
        setupAuthenticatedArtist();

        const fd = makeFormData({ genrePrimary: "A" }); // too short
        const result = await claimArtistProfileAction(ARTIST_ID, INITIAL_STATE, fd);

        expect(result.error?.code).toBe("VALIDATION_ERROR");
        expect(result.error?.fieldErrors?.genrePrimary).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// saveArtistOnboardingAction — status e privacy_settings
// ─────────────────────────────────────────────────────────────────────────────
describe("saveArtistOnboardingAction — status e privacySettings", () => {
    const INITIAL_STATE = { data: null, error: null } as const;

    function makeFormData(overrides: Record<string, string> = {}): FormData {
        const fd = new FormData();
        fd.set("artisticName", "DJ Save Test");
        fd.set("location", "Rio de Janeiro, RJ");
        fd.set("genrePrimary", "House");
        Object.entries(overrides).forEach(([k, v]) => fd.set(k, v));
        return fd;
    }

    function setupAuthenticatedArtist() {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
        mockLimit.mockResolvedValueOnce([{ id: "profile-uuid" }]); // profile
        mockLimit.mockResolvedValueOnce([]); // duplicate check (no duplicate)
    }

    beforeEach(() => {
        vi.clearAllMocks();
        setupSelectChain();
        setupInsertChain();
        setupStorage();
    });

    it("insere com status='pending_approval' e privacySettings default", async () => {
        setupAuthenticatedArtist();

        // redirect throws — catch it
        try {
            await saveArtistOnboardingAction(INITIAL_STATE, makeFormData());
        } catch {
            // redirect() throws internally
        }

        expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
            status: 'pending_approval',
            privacySettings: expect.objectContaining({ mode: 'public' }),
        }));
    });

    it("insere bio quando fornecida", async () => {
        setupAuthenticatedArtist();

        try {
            await saveArtistOnboardingAction(INITIAL_STATE, makeFormData({ bio: "Minha bio de artista" }));
        } catch {
            // redirect
        }

        expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
            bio: "Minha bio de artista",
        }));
    });

    it("insere privacySettings corretamente quando enviada como JSON", async () => {
        setupAuthenticatedArtist();
        const privacy = JSON.stringify({ mode: 'private', fields: { social_links: 'private', presskit: 'private', bio: 'private', genre: 'private' } });

        try {
            await saveArtistOnboardingAction(INITIAL_STATE, makeFormData({ privacySettings: privacy }));
        } catch {
            // redirect
        }

        expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
            privacySettings: expect.objectContaining({ mode: 'private' }),
        }));
    });
});
