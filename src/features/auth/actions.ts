"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/index";
import { profiles } from "@/db/schema/auth";
import { redirect } from "next/navigation";

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

export type SignUpState = {
    data: { userId: string } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function signUpAction(
    _prevState: SignUpState,
    formData: FormData
): Promise<SignUpState> {
    const rawData = {
        email: (formData.get("email") as string | null)?.trim().toLowerCase(),
        repeatEmail: (formData.get("repeatEmail") as string | null)?.trim().toLowerCase(),
        password: formData.get("password"),
        repeatPassword: formData.get("repeatPassword"),
        nickname: formData.get("nickname"),
        role: formData.get("role"),
        terms: formData.get("terms") === "on",
    };

    const parsed = signUpSchema.safeParse(rawData);

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
        return {
            data: null,
            error: {
                message: "Dados inválidos. Corrija os campos abaixo.",
                code: "VALIDATION_ERROR",
                fieldErrors,
            },
        };
    }

    const { email, password, nickname, role } = parsed.data;

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm`,
        },
    });

    if (authError) {
        return {
            data: null,
            error: {
                message: authError.message,
                code: "AUTH_ERROR",
            },
        };
    }

    if (!authData.user) {
        return {
            data: null,
            error: {
                message: "Erro ao criar usuário",
                code: "AUTH_ERROR",
            },
        };
    }

    try {
        await db.insert(profiles).values({
            userId: authData.user.id,
            nickname,
            role,
        });
    } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === "23505") {
            return {
                data: null,
                error: { message: "Este email já possui uma conta. Faça login.", code: "ALREADY_EXISTS" },
            };
        }
        return {
            data: null,
            error: {
                message: "Erro ao criar perfil. Tente novamente.",
                code: "PROFILE_ERROR",
            },
        };
    }

    if (role === "artista") {
        redirect("/onboarding/artista");
    } else {
        redirect("/onboarding/produtor");
    }
}

export const signInSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "A senha é obrigatória"),
});

export type SignInState = {
    data: { success: boolean } | null;
    error: { message: string; code: string; fieldErrors?: Record<string, string[]> } | null;
};

export async function signInAction(
    _prevState: SignInState,
    formData: FormData
): Promise<SignInState> {
    const rawData = {
        email: (formData.get("email") as string | null)?.trim().toLowerCase(),
        password: formData.get("password"),
    };

    const parsed = signInSchema.safeParse(rawData);

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
        return {
            data: null,
            error: {
                message: "Dados inválidos. Corrija os campos abaixo.",
                code: "VALIDATION_ERROR",
                fieldErrors,
            },
        };
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        return {
            data: null,
            error: {
                message: "Credenciais inválidas.",
                code: "AUTH_ERROR",
            },
        };
    }

    redirect("/dashboard");
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}

export { signUpSchema };
