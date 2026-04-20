"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateCollectiveForm } from "@/features/collectives/components/create-collective-form";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Music2, Clock } from "lucide-react";

type OnboardingPath = "select" | "create" | "wait";

export default function ProducerOnboardingPage() {
    const [activePath, setActivePath] = useState<OnboardingPath>("select");

    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">

            {activePath === "select" && (
                <Card className="border border-border max-w-2xl mx-auto w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">Bem-vindo, Produtor!</CardTitle>
                        <CardDescription>
                            Como você gostaria de começar na Agenda Clubber? Escolha a opção que melhor se encaixa no seu perfil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {/* Path A */}
                        <div
                            onClick={() => setActivePath("create")}
                            className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:border-neon-red transition-all group"
                        >
                            <div className="p-3 bg-neon-red/10 rounded-full mr-4 text-neon-red">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-lg group-hover:text-neon-red">Criar um Coletivo/Label</h3>
                                <p className="text-sm text-muted-foreground">Sou gestor ou admin de um novo coletivo e quero registrá-lo.</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-red" />
                        </div>

                        {/* Path B */}
                        <Link
                            href="/onboarding/artist"
                            className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:border-neon-red transition-all group"
                        >
                            <div className="p-3 bg-neon-red/10 rounded-full mr-4 text-neon-red">
                                <Music2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-lg group-hover:text-neon-red">Também sou Artista</h3>
                                <p className="text-sm text-muted-foreground">Mudei de ideia e quero criar meu perfil de Artista primeiro.</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-red" />
                        </Link>

                        {/* Path C */}
                        <div
                            onClick={() => setActivePath("wait")}
                            className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:border-neon-red transition-all group"
                        >
                            <div className="p-3 bg-neon-red/10 rounded-full mr-4 text-neon-red">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-lg group-hover:text-neon-red">Vou aguardar um convite</h3>
                                <p className="text-sm text-muted-foreground">Meu coletivo já existe e estou apenas aguardando ser adicionado.</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-red" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {activePath === "create" && (
                <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                    <Button variant="ghost" onClick={() => setActivePath("select")} className="self-start mb-2">
                        Voltar
                    </Button>
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Criar Coletivo</h2>
                            <p className="text-muted-foreground">Insira as informações do coletivo que você gerencia.</p>
                        </div>
                        <CreateCollectiveForm />
                    </div>
                </div>
            )}

            {activePath === "wait" && (
                <Card className="border border-border max-w-lg mx-auto w-full text-center">
                    <CardHeader>
                        <div className="mx-auto p-4 bg-neon-red/10 rounded-full w-fit mb-4">
                            <Clock className="w-10 h-10 text-neon-red" />
                        </div>
                        <CardTitle className="text-2xl">Aguarde o Convite</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Peça para que um administrador do seu coletivo lhe envie um convite para o mesmo e-mail cadastrado nesta conta.
                            Quando o convite chegar, clique no link para se juntar ao coletivo nativamente na plataforma.
                        </p>
                        <div className="flex flex-col gap-2 w-full mt-4">
                            <Button variant="outline" onClick={() => setActivePath("select")}>Voltar para Opções</Button>
                            <Link href="/">
                                <Button variant="ghost" className="w-full">Ir para Página Inicial</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
