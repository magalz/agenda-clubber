"use client";

import { useState } from "react";
import { SearchBeforeCreate } from "@/features/artists/components/search-before-create";
import { OnboardingForm } from "@/features/artists/components/onboarding-form";

export default function ArtistOnboardingPage() {
    const [artisticName, setArtisticName] = useState<string | null>(null);

    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
            {!artisticName ? (
                <SearchBeforeCreate onProceed={(name) => setArtisticName(name)} />
            ) : (
                <OnboardingForm initialArtisticName={artisticName} />
            )}
        </div>
    );
}
