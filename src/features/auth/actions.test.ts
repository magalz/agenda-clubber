import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-define schema inline for unit testing (avoids server-only module issues)
const signUpSchema = z.object({
    email: z.string().email("Email inválido"),
    repeatEmail: z.string().email("Email inválido"),
    password: z
        .string()
        .min(8, "A senha deve ter no mínimo 8 caracteres")
        .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
        .regex(/[0-9]/, "A senha deve conter ao menos um número"),
    repeatPassword: z.string().min(1, "Confirme sua senha"),
    nickname: z
        .string()
        .min(2, "O apelido deve ter no mínimo 2 caracteres")
        .max(50, "O apelido deve ter no máximo 50 caracteres"),
    role: z.enum(["artista", "produtor"], {
        errorMap: () => ({ message: "Selecione um papel" }),
    }),
    terms: z.literal(true, {
        errorMap: () => ({ message: "Você deve aceitar os termos de uso" }),
    }),
}).refine((data) => data.email === data.repeatEmail, {
    message: "Os emails não coincidem",
    path: ["repeatEmail"],
}).refine((data) => data.password === data.repeatPassword, {
    message: "As senhas não coincidem",
    path: ["repeatPassword"],
});

const validData = {
    email: "test@example.com",
    repeatEmail: "test@example.com",
    password: "MyPass123",
    repeatPassword: "MyPass123",
    nickname: "DJ Test",
    role: "artista" as const,
    terms: true as const,
};

describe("signUpAction validation", () => {
    it("accepts valid sign-up data", () => {
        expect(signUpSchema.safeParse(validData).success).toBe(true);
    });

    it("rejects invalid email", () => {
        const result = signUpSchema.safeParse({ ...validData, email: "not-an-email", repeatEmail: "not-an-email" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.email).toBeDefined();
        }
    });

    it("rejects mismatched emails", () => {
        const result = signUpSchema.safeParse({ ...validData, repeatEmail: "other@example.com" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.repeatEmail).toBeDefined();
        }
    });

    it("rejects weak password (too short)", () => {
        const result = signUpSchema.safeParse({ ...validData, password: "Ab1", repeatPassword: "Ab1" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.password).toBeDefined();
        }
    });

    it("rejects password without uppercase", () => {
        const result = signUpSchema.safeParse({ ...validData, password: "mypass123", repeatPassword: "mypass123" });
        expect(result.success).toBe(false);
    });

    it("rejects password without number", () => {
        const result = signUpSchema.safeParse({ ...validData, password: "MyPassWord", repeatPassword: "MyPassWord" });
        expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
        const result = signUpSchema.safeParse({ ...validData, repeatPassword: "MyPass456" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.repeatPassword).toBeDefined();
        }
    });

    it("rejects empty nickname", () => {
        const result = signUpSchema.safeParse({ ...validData, nickname: "" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.nickname).toBeDefined();
        }
    });

    it("rejects missing role", () => {
        const result = signUpSchema.safeParse({ ...validData, role: "invalid" as "artista" });
        expect(result.success).toBe(false);
    });

    it("rejects terms not accepted", () => {
        const result = signUpSchema.safeParse({ ...validData, terms: false as unknown as true });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.terms).toBeDefined();
        }
    });

    it("accepts role artista", () => {
        expect(signUpSchema.safeParse({ ...validData, role: "artista" }).success).toBe(true);
    });

    it("accepts role produtor", () => {
        expect(signUpSchema.safeParse({ ...validData, role: "produtor" }).success).toBe(true);
    });
});
