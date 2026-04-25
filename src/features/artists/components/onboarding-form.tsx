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
import { Textarea } from "@/components/ui/textarea";
import { useActionState } from "react";
import {
    saveArtistOnboardingAction,
    claimArtistProfileAction,
    type ArtistOnboardingState,
    type ClaimArtistState,
} from "@/features/artists/actions";
import { PrivacySettingsFieldset } from "./privacy-settings-fieldset";

type CreateMode = {
    mode: 'create';
    initialArtisticName: string;
};

type ClaimMode = {
    mode: 'claim';
    artistId: string;
    initialArtisticName: string;
    initialLocation: string;
};

type OnboardingFormProps = (CreateMode | ClaimMode) & React.ComponentPropsWithoutRef<"div">;

const initialCreateState: ArtistOnboardingState = { data: null, error: null };
const initialClaimState: ClaimArtistState = { data: null, error: null };

function CreateForm({ initialArtisticName, className, ...props }: CreateMode & React.ComponentPropsWithoutRef<"div">) {
    const [state, formAction, isPending] = useActionState(saveArtistOnboardingAction, initialCreateState);

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
                        <FormFields
                            artisticName={initialArtisticName}
                            artisticNameReadOnly={true}
                            locationReadOnly={false}
                            state={state}
                            isPending={isPending}
                            submitLabel="Finalizar Onboarding"
                        />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function ClaimFormInner({ artistId, initialArtisticName, initialLocation, className, ...props }: ClaimMode & React.ComponentPropsWithoutRef<"div">) {
    const boundAction = claimArtistProfileAction.bind(null, artistId);
    const [state, formAction, isPending] = useActionState(boundAction, initialClaimState);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border border-border max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Reivindicar Perfil</CardTitle>
                    <CardDescription>
                        Complete os dados abaixo para reivindicar este perfil. Após a submissão, aguarde a aprovação do admin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} encType="multipart/form-data">
                        <FormFields
                            artisticName={initialArtisticName}
                            artisticNameReadOnly={true}
                            initialLocation={initialLocation}
                            locationReadOnly={true}
                            state={state}
                            isPending={isPending}
                            submitLabel="Reivindicar Perfil"
                        />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

interface FormFieldsProps {
    artisticName: string;
    artisticNameReadOnly: boolean;
    initialLocation?: string;
    locationReadOnly: boolean;
    state: ArtistOnboardingState | ClaimArtistState;
    isPending: boolean;
    submitLabel: string;
}

function FormFields({
    artisticName,
    artisticNameReadOnly,
    initialLocation,
    locationReadOnly,
    state,
    isPending,
    submitLabel,
}: FormFieldsProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Artistic Name */}
                <div className="grid gap-2 col-span-1 md:col-span-2">
                    <Label htmlFor="artisticName">Nome Artístico <span className="text-neon-red">*</span></Label>
                    <Input
                        id="artisticName"
                        name="artisticName"
                        type="text"
                        defaultValue={artisticName}
                        readOnly={artisticNameReadOnly}
                        className={artisticNameReadOnly ? "opacity-70" : ""}
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
                        defaultValue={initialLocation}
                        readOnly={locationReadOnly}
                        className={locationReadOnly ? "opacity-70" : ""}
                        required={!locationReadOnly}
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

            {/* Bio */}
            <div className="grid gap-2">
                <Label htmlFor="bio">Bio (Opcional)</Label>
                <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Conte um pouco sobre você e sua trajetória musical..."
                    maxLength={2000}
                    rows={4}
                />
                {state.error?.fieldErrors?.bio && (
                    <p className="text-sm text-neon-red">{state.error.fieldErrors.bio[0]}</p>
                )}
                <p className="text-xs text-muted-foreground">Máximo 2000 caracteres</p>
            </div>

            {/* Privacy Settings */}
            <div className="pt-4 border-t border-border">
                <PrivacySettingsFieldset />
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
                {isPending ? "Salvando..." : submitLabel}
            </Button>
        </div>
    );
}

export function OnboardingForm(props: OnboardingFormProps) {
    const { mode, className, ...rest } = props;
    if (mode === 'claim') {
        const { artistId, initialArtisticName, initialLocation } = rest as ClaimMode;
        return <ClaimFormInner mode="claim" artistId={artistId} initialArtisticName={initialArtisticName} initialLocation={initialLocation} className={className} />;
    }
    const { initialArtisticName } = rest as CreateMode;
    return <CreateForm mode="create" initialArtisticName={initialArtisticName} className={className} />;
}
