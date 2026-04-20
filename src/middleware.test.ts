import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware, config } from "./middleware";
import { NextRequest, NextResponse } from "next/server";

// Mocking the next/server modules
vi.mock("next/server", () => {
    return {
        NextRequest: class {
            nextUrl: { pathname: string; clone: () => URL };
            cookies: { getAll: () => unknown[]; set: (name: string, value: string) => void };
            constructor(url: string) {
                const parsedUrl = new URL(url);
                this.nextUrl = {
                    pathname: parsedUrl.pathname,
                    clone: () => new URL(url),
                };
                this.cookies = {
                    getAll: vi.fn().mockReturnValue([]),
                    set: vi.fn(),
                };
            }
        },
        NextResponse: {
            next: vi.fn().mockReturnValue({
                cookies: {
                    set: vi.fn(),
                },
            }),
            redirect: vi.fn().mockImplementation((url) => ({
                status: 307,
                url: url.toString()
            })),
        },
    };
});

// Mocking Supabase SSR client
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

        // Default: no user
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it("exports matchers properly", () => {
        expect(config.matcher).toBeDefined();
        expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("redirects unauthenticated users from /dashboard to /auth/login", async () => {
        const req = new NextRequest("http://localhost:3000/dashboard");
        await middleware(req);
        expect(NextResponse.redirect).toHaveBeenCalled();
        const mockRedirect = NextResponse.redirect as ReturnType<typeof vi.fn>;
        const urlPassed = mockRedirect.mock.calls[mockRedirect.mock.calls.length - 1][0];
        expect(urlPassed.pathname).toBe("/auth/login");
    });

    it("redirects authenticated users from /auth/login to /dashboard", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        const req = new NextRequest("http://localhost:3000/auth/login");
        await middleware(req);
        expect(NextResponse.redirect).toHaveBeenCalled();
        const mockRedirect = NextResponse.redirect as ReturnType<typeof vi.fn>;
        const urlPassed = mockRedirect.mock.calls[mockRedirect.mock.calls.length - 1][0];
        expect(urlPassed.pathname).toBe("/dashboard");
    });

    it("allows unauthenticated users to access public routes", async () => {
        const req = new NextRequest("http://localhost:3000/public");
        await middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it("checks RBAC on /admin and allows admin to pass", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        mockSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
        const req = new NextRequest("http://localhost:3000/admin/users");
        await middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it("checks RBAC on /admin and restricts non-admins", async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
        mockSingle.mockResolvedValue({ data: { role: "artista" }, error: null });
        const req = new NextRequest("http://localhost:3000/admin/users");
        await middleware(req);
        expect(NextResponse.redirect).toHaveBeenCalled();
        const mockRedirect = NextResponse.redirect as ReturnType<typeof vi.fn>;
        const urlPassed = mockRedirect.mock.calls[mockRedirect.mock.calls.length - 1][0];
        expect(urlPassed.pathname).toBe("/dashboard");
    });
});
