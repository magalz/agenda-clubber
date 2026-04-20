import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware, config } from "./middleware";
import { NextRequest } from "next/server";

// Mocking Supabase SSR client — external service, appropriate to mock
const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@supabase/ssr", () => {
    return {
        createServerClient: vi.fn().mockReturnValue({
            auth: {
                getUser: () => mockGetUser(),
            },
            from: () => mockFrom(),
        }),
    };
});

describe("middleware logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it("exports matchers properly", () => {
        expect(config.matcher).toBeDefined();
        expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("redirects unauthenticated users from /dashboard to /auth/login", async () => {
        const req = new NextRequest("http://localhost:3000/dashboard");
        const response = await middleware(req);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/auth/login");
    });

    it("redirects authenticated users from /auth/login to /dashboard", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        const req = new NextRequest("http://localhost:3000/auth/login");
        const response = await middleware(req);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("allows unauthenticated users to access public routes", async () => {
        const req = new NextRequest("http://localhost:3000/public");
        const response = await middleware(req);
        expect(response.status).toBe(200);
    });

    it("checks RBAC on /admin and allows admin to pass", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        mockSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
        const req = new NextRequest("http://localhost:3000/admin/users");
        const response = await middleware(req);
        expect(response.status).toBe(200);
    });

    it("checks RBAC on /admin and restricts non-admins", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        mockSingle.mockResolvedValue({ data: { role: "artista" }, error: null });
        const req = new NextRequest("http://localhost:3000/admin/users");
        const response = await middleware(req);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
    });
});
