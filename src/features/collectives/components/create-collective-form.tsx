"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCollectiveAction, type CreateCollectiveState } from "@/features/collectives/actions";

const initialState: CreateCollectiveState = { data: null, error: null };

export function CreateCollectiveForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [state, formAction, isPending] = useActionState(createCollectiveAction, initialState);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2 col-span-1 md:col-span-2">
                        <Label htmlFor="name">Nome do Coletivo <span className="text-neon-red">*</span></Label>
                        <Input id="name" name="name" type="text" placeholder="Ex: Underground Resistance Fortaleza" required />
                        {state.error?.fieldErrors?.name && <p className="text-sm text-neon-red">{state.error.fieldErrors.name[0]}</p>}
                    </div>

                    <div className="grid gap-2 col-span-1 md:col-span-2">
                        <Label htmlFor="location">Localidade <span className="text-neon-red">*</span></Label>
                        <Input id="location" name="location" type="text" placeholder="Ex: Fortaleza, CE" required />
                        {state.error?.fieldErrors?.location && <p className="text-sm text-neon-red">{state.error.fieldErrors.location[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="genrePrimary">Gênero Principal <span className="text-neon-red">*</span></Label>
                        <Input id="genrePrimary" name="genrePrimary" type="text" placeholder="Ex: Techno" required />
                        {state.error?.fieldErrors?.genrePrimary && <p className="text-sm text-neon-red">{state.error.fieldErrors.genrePrimary[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="genreSecondary">Gênero Secundário (Opcional)</Label>
                        <Input id="genreSecondary" name="genreSecondary" type="text" placeholder="Ex: House" />
                    </div>

                    <div className="grid gap-2 col-span-1 md:col-span-2">
                        <Label htmlFor="logo">Logo do Coletivo</Label>
                        <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png" />
                        {state.error?.fieldErrors?.logo && <p className="text-sm text-neon-red">{state.error.fieldErrors.logo[0]}</p>}
                        <p className="text-xs text-muted-foreground">JPEG ou PNG, máximo 5MB</p>
                    </div>

                    <div className="grid gap-2 col-span-1 md:col-span-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" name="description" placeholder="Uma breve descrição sobre a proposta do coletivo..." className="resize-none" />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground">Redes e Informações Adicionais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/..." />
                            {state.error?.fieldErrors?.instagram && <p className="text-sm text-neon-red">{state.error.fieldErrors.instagram[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="soundcloud">Soundcloud</Label>
                            <Input id="soundcloud" name="soundcloud" type="url" placeholder="https://soundcloud.com/..." />
                            {state.error?.fieldErrors?.soundcloud && <p className="text-sm text-neon-red">{state.error.fieldErrors.soundcloud[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="youtube">YouTube</Label>
                            <Input id="youtube" name="youtube" type="url" placeholder="https://youtube.com/..." />
                            {state.error?.fieldErrors?.youtube && <p className="text-sm text-neon-red">{state.error.fieldErrors.youtube[0]}</p>}
                        </div>
                    </div>
                </div>

                {state.error && !state.error.fieldErrors && (
                    <p className="text-sm text-neon-red">{state.error.message}</p>
                )}

                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                    {isPending ? "Criando o Coletivo..." : "Criar Coletivo"}
                </Button>
            </form>
        </div>
    );
}
