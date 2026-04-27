"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PrivacyMode, ArtistPrivacySettings } from "@/features/artists/types";
import { privacySettingsFromMode } from "@/features/artists/types";

const PRIVACY_OPTIONS: { value: PrivacyMode; label: string; description: string }[] = [
    {
        value: 'public',
        label: 'Público',
        description: 'Todos os usuários podem ver seu perfil completo.',
    },
    {
        value: 'collectives_only',
        label: 'Apenas Coletivos',
        description: 'Visível somente para usuários logados com papel de produtor ou membros de coletivos.',
    },
    {
        value: 'private',
        label: 'Privado',
        description: 'Apenas você e os admins da plataforma veem os campos sensíveis. Nome e localidade permanecem públicos.',
    },
    {
        value: 'ghost',
        label: 'Ghost Mode',
        description: 'Sua página não será acessível por URL pública. Apenas coletivos podem convidá-lo.',
    },
];

interface PrivacySettingsFieldsetProps {
    defaultMode?: PrivacyMode;
}

export function PrivacySettingsFieldset({ defaultMode = 'public' }: PrivacySettingsFieldsetProps) {
    const [mode, setMode] = useState<PrivacyMode>(defaultMode);

    const settings: ArtistPrivacySettings = privacySettingsFromMode(mode);

    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Configurações de Privacidade</legend>
            <RadioGroup
                value={mode}
                onValueChange={(val) => setMode(val as PrivacyMode)}
                className="gap-3"
            >
                {PRIVACY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-start gap-3">
                        <RadioGroupItem value={option.value} id={`privacy-${option.value}`} className="mt-0.5" />
                        <div className="grid gap-0.5">
                            <Label htmlFor={`privacy-${option.value}`} className="font-medium cursor-pointer">
                                {option.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                    </div>
                ))}
            </RadioGroup>
            <input
                type="hidden"
                name="privacySettings"
                value={JSON.stringify(settings)}
            />
        </fieldset>
    );
}
