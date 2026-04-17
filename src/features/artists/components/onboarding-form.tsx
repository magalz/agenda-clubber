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
import { useActionState } from "react";
import { saveArtistOnboardingAction, type ArtistOnboardingState } from "@/features/artists/actions";

const initialState: ArtistOnboardingState = { data: null, error: null };

interface OnboardingFormProps extends React.ComponentPropsWithoutRef<"div"> {
    initialArtisticName: string;
}

export function OnboardingForm({
    initialArtisticName,
    className,
    ...props
}: OnboardingFormProps) {
    const [state, formAction, isPending] = useActionState(saveArtistOnboardingAction, initialState);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border border-border max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
                    <CardDescription>
                        Forneça os detalhes abaixo para criar seu perfil de Artista.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} encType="multipart/form-data">
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Artistic Name */}
                                <div className="grid gap-2 col-span-1 md:col-span-2">
                                    <Label htmlFor="artisticName">Nome Artístico <span className="text-neon-red">*</span></Label>
                                    <Input
                                        id="artisticName"
                                        name="artisticName"
                                        type="text"
                                        defaultValue={initialArtisticName}
                                        readOnly // Since they searched for it, lock it here or let them edit? We'll let it be readonly for UX safety since we just checked it.
                                    />
                                    {state.error?.fieldErrors?.artisticName && (
                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.artisticName[0]}</p>
                                    )}
                                </div>

                                {/* Profile Photo */}
                                <div className="grid gap-2 col-span-1 md:col-span-2">
                                    <Label htmlFor="photo">Foto de Perfil</Label>
                                    <Input
                                        id="photo"
                                        name="photo"
                                        type="file"
                                        accept="image/jpeg,image/png"
                                    />
                                    {state.error?.fieldErrors?.photo && (
                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.photo[0]}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">JPEG ou PNG, máximo 5MB</p>
                                </div>

                                {/* Location */}
                                <div className="grid gap-2 col-span-1 md:col-span-2">
                                    <Label htmlFor="location">Localidade (Cidade/Estado) <span className="text-neon-red">*</span></Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        type="text"
                                        placeholder="Ex: São Paulo, SP"
                                        required
                                    />
                                    {state.error?.fieldErrors?.location && (
                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.location[0]}</p>
                                    )}
                                </div>

                                {/* Primary Genre */}
                                <div className="grid gap-2">
                                    <Label htmlFor="genrePrimary">Gênero Principal <span className="text-neon-red">*</span></Label>
                                    <Input
                                        id="genrePrimary"
                                        name="genrePrimary"
                                        type="text"
                                        placeholder="Ex: Techno"
                                        required
                                    />
                                    {state.error?.fieldErrors?.genrePrimary && (
                                        <p className="text-sm text-neon-red">{state.error.fieldErrors.genrePrimary[0]}</p>
                                    )}
                                </div>

                                {/* Secondary Genre */}
                                <div className="grid gap-2">
                                    <Label htmlFor="genreSecondary">Gênero Secundário (Opcional)</Label>
                                    <Input
                                        id="genreSecondary"
                                        name="genreSecondary"
                                        type="text"
                                        placeholder="Ex: Tech House"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <h4 className="font-medium text-sm text-muted-foreground">Redes e Links (Opcional)</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="soundcloud">Soundcloud</Label>
                                        <Input id="soundcloud" name="soundcloud" type="url" placeholder="https://soundcloud.com/..." />
                                        {state.error?.fieldErrors?.soundcloud && (
                                            <p className="text-sm text-neon-red">{state.error.fieldErrors.soundcloud[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="instagram">Instagram</Label>
                                        <Input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/..." />
                                        {state.error?.fieldErrors?.instagram && (
                                            <p className="text-sm text-neon-red">{state.error.fieldErrors.instagram[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="youtube">YouTube</Label>
                                        <Input id="youtube" name="youtube" type="url" placeholder="https://youtube.com/..." />
                                        {state.error?.fieldErrors?.youtube && (
                                            <p className="text-sm text-neon-red">{state.error.fieldErrors.youtube[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="presskitUrl">Presskit Link</Label>
                                        <Input id="presskitUrl" name="presskitUrl" type="url" placeholder="G-Drive / Dropbox link..." />
                                        {state.error?.fieldErrors?.presskitUrl && (
                                            <p className="text-sm text-neon-red">{state.error.fieldErrors.presskitUrl[0]}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2 col-span-1 md:col-span-2">
                                        <Label htmlFor="releasePdf">Release PDF</Label>
                                        <Input
                                            id="releasePdf"
                                            name="releasePdf"
                                            type="file"
                                            accept="application/pdf"
                                        />
                                        {state.error?.fieldErrors?.releasePdf && (
                                            <p className="text-sm text-neon-red">{state.error.fieldErrors.releasePdf[0]}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">PDF, máximo 20MB</p>
                                    </div>
                                </div>
                            </div>

                            {state.error && !state.error.fieldErrors && (
                                <p className="text-sm text-neon-red">{state.error.message}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Salvando..." : "Finalizar Onboarding"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
