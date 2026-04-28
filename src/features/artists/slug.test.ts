import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
    it("lowercases ASCII names", () => {
        expect(slugify("DJ Alpha")).toBe("dj-alpha");
    });

    it("strips Latin diacritics", () => {
        expect(slugify("João")).toBe("joao");
        expect(slugify("Beyoncé")).toBe("beyonce");
        expect(slugify("Ñoño")).toBe("nono");
    });

    it("replaces consecutive non-alnum characters with a single dash", () => {
        expect(slugify("DJ  Alpha--Beta")).toBe("dj-alpha-beta");
        expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("trims leading and trailing dashes", () => {
        expect(slugify("  DJ Alpha  ")).toBe("dj-alpha");
        expect(slugify("---DJ---")).toBe("dj");
    });

    it("handles numbers", () => {
        expect(slugify("DJ 2Fast")).toBe("dj-2fast");
        expect(slugify("K-391")).toBe("k-391");
    });

    it("handles all non-alnum input gracefully", () => {
        expect(slugify("!@#$%")).toBe("");
    });

    it("preserves digits-only names", () => {
        expect(slugify("909")).toBe("909");
    });
});

describe("uniqueSlug", () => {
    it("returns base slug when no collision", async () => {
        const result = await uniqueSlug("DJ Alpha", async () => false);
        expect(result).toBe("dj-alpha");
    });

    it("appends -2 on first collision", async () => {
        const taken = new Set(["dj-alpha"]);
        const result = await uniqueSlug("DJ Alpha", async (s) => taken.has(s));
        expect(result).toBe("dj-alpha-2");
    });

    it("appends -3 on second collision", async () => {
        const taken = new Set(["dj-alpha", "dj-alpha-2"]);
        const result = await uniqueSlug("DJ Alpha", async (s) => taken.has(s));
        expect(result).toBe("dj-alpha-3");
    });
});
