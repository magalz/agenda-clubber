'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Props = {
    eventId: string;
    isNamePublic: boolean;
    isLocationPublic: boolean;
    isLineupPublic: boolean;
    disabled: boolean;
    onToggle: (eventId: string, field: string, value: boolean) => void;
};

export function VisibilityToggles({ eventId, isNamePublic, isLocationPublic, isLineupPublic, disabled, onToggle }: Props) {
    return (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Visibilidade para outros coletivos</p>
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`name-public-${eventId}`}
                    checked={isNamePublic}
                    disabled={disabled}
                    onCheckedChange={(v) => onToggle(eventId, 'isNamePublic', v === true)}
                />
                <Label htmlFor={`name-public-${eventId}`} className="text-xs cursor-pointer">Nome público</Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`location-public-${eventId}`}
                    checked={isLocationPublic}
                    disabled={disabled}
                    onCheckedChange={(v) => onToggle(eventId, 'isLocationPublic', v === true)}
                />
                <Label htmlFor={`location-public-${eventId}`} className="text-xs cursor-pointer">Local público</Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`lineup-public-${eventId}`}
                    checked={isLineupPublic}
                    disabled={disabled}
                    onCheckedChange={(v) => onToggle(eventId, 'isLineupPublic', v === true)}
                />
                <Label htmlFor={`lineup-public-${eventId}`} className="text-xs cursor-pointer">Line-up pública</Label>
            </div>
        </div>
    );
}
