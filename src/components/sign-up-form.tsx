"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type SignUpState } from "@/features/auth/actions";

const initialState: SignUpState = { data: null, error: null };

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se para acessar a Agenda Clubber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-5">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  required
                />
                {state.error?.fieldErrors?.email && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Repeat Email */}
              <div className="grid gap-2">
                <Label htmlFor="repeatEmail">Confirme o Email</Label>
                <Input
                  id="repeatEmail"
                  name="repeatEmail"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="off"
                  required
                />
                {state.error?.fieldErrors?.repeatEmail && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.repeatEmail[0]}</p>
                )}
              </div>

              {/* Nickname */}
              <div className="grid gap-2">
                <Label htmlFor="nickname">Como quer ser chamado?</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="Seu apelido"
                  required
                />
                {state.error?.fieldErrors?.nickname && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.nickname[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, 1 maiúscula e 1 número
                </p>
                {state.error?.fieldErrors?.password && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Repeat Password */}
              <div className="grid gap-2">
                <Label htmlFor="repeatPassword">Confirme a Senha</Label>
                <Input
                  id="repeatPassword"
                  name="repeatPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                {state.error?.fieldErrors?.repeatPassword && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.repeatPassword[0]}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="grid gap-3">
                <Label>Qual é o seu papel?</Label>
                <RadioGroup name="role" className="grid gap-3" required>
                  <label
                    htmlFor="role-artista"
                    className="flex items-center gap-3 rounded-md border border-border p-4 cursor-pointer hover:border-neon-red transition-colors [&:has([data-state=checked])]:border-neon-red"
                  >
                    <RadioGroupItem value="artista" id="role-artista" />
                    <div>
                      <span className="font-medium">🎵 Sou Artista</span>
                      <p className="text-xs text-muted-foreground">DJ, produtor musical, artista</p>
                    </div>
                  </label>
                  <label
                    htmlFor="role-produtor"
                    className="flex items-center gap-3 rounded-md border border-border p-4 cursor-pointer hover:border-neon-red transition-colors [&:has([data-state=checked])]:border-neon-red"
                  >
                    <RadioGroupItem value="produtor" id="role-produtor" />
                    <div>
                      <span className="font-medium">🎪 Sou Produtor de Eventos</span>
                      <p className="text-xs text-muted-foreground">Organizador, promoter, coletivo</p>
                    </div>
                  </label>
                </RadioGroup>
                {state.error?.fieldErrors?.role && (
                  <p className="text-sm text-neon-red">{state.error.fieldErrors.role[0]}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox id="terms" name="terms" />
                <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  Li e aceito os{" "}
                  <Link href="/termos" className="underline text-neon-red hover:text-neon-red/80">
                    Termos de Uso e Confidencialidade
                  </Link>
                </Label>
              </div>
              {state.error?.fieldErrors?.terms && (
                <p className="text-sm text-neon-red">{state.error.fieldErrors.terms[0]}</p>
              )}

              {/* General Error */}
              {state.error && !state.error.fieldErrors && (
                <p className="text-sm text-neon-red">{state.error.message}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Criando conta..." : "Criar conta"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4 hover:text-neon-red">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
