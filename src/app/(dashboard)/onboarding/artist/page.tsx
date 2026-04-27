"use client";

import { useState } from "react";
import { SearchBeforeCreate } from "@/features/artists/components/search-before-create";
import { OnboardingForm } from "@/features/artists/components/onboarding-form";
import { ArtistIdentityCard } from "@/features/artists/components/artist-identity-card";
import { Button } from "@/components/ui/button";
import type { RestrictedArtistHit } from "@/features/artists/actions";

type Step =
    | { name: 'search' }
    | { name: 'claim'; hit: RestrictedArtistHit }
    | { name: 'create'; artisticName: string };

export default function ArtistOnboardingPage() {
    const [step, setStep] = useState<Step>({ name: 'search' });

    if (step.name === 'search') {
        return (
            <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
                <SearchBeforeCreate
                    onProceed={(result) => {
                        if (result.step === 'claim') {
                            setStep({ name: 'claim', hit: result.hit });
                        } else {
                            setStep({ name: 'create', artisticName: result.artisticName });
                        }
                    }}
                />
            </div>
        );
    }

    if (step.name === 'claim') {
        const { hit } = step;
        return (
            <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="max-w-md w-full space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">Encontramos um perfil com este nome</h2>
                        <p className="text-sm text-muted-foreground">
                            Este perfil foi criado por um coletivo. Se você é este artista, reivindique-o abaixo.
                        </p>
                    </div>
                    <ArtistIdentityCard
                        variant="restricted"
                        artisticName={hit.artisticName}
                        location={hit.location}
                        genrePrimary={hit.genrePrimary}
                        photoUrl={hit.photoUrl}
                        onClaim={() => {}}
                    />
                    <div className="flex flex-col gap-2">
                        <OnboardingForm
                            mode="claim"
                            artistId={hit.id}
                            initialArtisticName={hit.artisticName}
                            initialLocation={hit.location}
                        />
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => setStep({ name: 'create', artisticName: step.hit.artisticName })}
                        >
                            Não sou eu, criar novo perfil
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // step.name === 'create'
    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
            <OnboardingForm
                mode="create"
                initialArtisticName={step.artisticName}
            />
        </div>
    );
}
