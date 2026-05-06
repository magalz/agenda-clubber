'use client';

import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { EthicalDelayButton } from './ethical-delay-button';
import { ConflictBadge } from './conflict-badge';
import { VisibilityToggles } from './visibility-toggles';
import { filterEventForViewer } from '../logic/visibility';
import type { CalendarEvent } from '../types';

type Props = {
    event: CalendarEvent;
    collectiveId?: string;
    isStatusPending: boolean;
    isTogglePending: boolean;
    onStatusChange: (eventId: string, status: 'planning' | 'confirmed') => void;
    onToggleVisibility: (eventId: string, field: string, value: boolean) => void;
};

export function EventCard({
    event,
    collectiveId,
    isStatusPending,
    isTogglePending,
    onStatusChange,
    onToggleVisibility,
}: Props) {
    const isOwn = Boolean(collectiveId && event.collectiveId === collectiveId);
    const displayEvent = isOwn ? event : filterEventForViewer(event, { kind: 'anon' }, false);
    const isMasked = !isOwn && event.status === 'planning';
    const isNameMasked = isMasked && event.isNamePublic === false && event.name !== 'Em Planejamento';
    const isLocationMasked = isMasked && event.isLocationPublic === false;
    const isLineupMasked = isMasked && event.isLineupPublic === false;

    return (
        <li className="border border-border rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
                {event.conflictLevel && (
                    <ConflictBadge level={event.conflictLevel} justification={event.conflictJustification} />
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                }`}>
                    {event.status === 'confirmed' ? 'Confirmado' : 'Em Planejamento'}
                </span>
            </div>

            <p className={`font-medium ${isNameMasked ? 'text-muted-foreground italic flex items-center gap-1' : ''}`}>
                {displayEvent.name}
                {isNameMasked && <Lock className="w-3 h-3" aria-label="Nome não revelado" />}
            </p>

            <p className={`text-sm ${isLocationMasked ? 'text-muted-foreground italic flex items-center gap-1' : 'text-muted-foreground'}`}>
                {displayEvent.locationName === 'Em Planejamento' ? 'Local não revelado' : displayEvent.locationName}
                {isLocationMasked && <Lock className="w-3 h-3" aria-label="Local não revelado" />}
            </p>

            <p className="text-xs text-muted-foreground">{displayEvent.genrePrimary}</p>

            {displayEvent.lineup.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                    Line-up: {displayEvent.lineup.join(', ')}
                </p>
            )}
            {isLineupMasked && displayEvent.lineup.length === 0 && event.lineup.length > 0 && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
                    Line-up não revelada <Lock className="w-3 h-3" aria-label="Line-up não revelada" />
                </p>
            )}

            {isOwn && event.status === 'confirmed' && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={isStatusPending}
                    onClick={() => onStatusChange(event.id, 'planning')}
                >
                    Reabrir planejamento
                </Button>
            )}

            {isOwn && event.status === 'planning' && (
                <>
                    {event.conflictLevel === 'red' ? (
                        <EthicalDelayButton
                            onConfirm={() => onStatusChange(event.id, 'confirmed')}
                            onCancel={() => {}}
                            disabled={isStatusPending}
                        />
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            className="mt-2 w-full"
                            disabled={isStatusPending}
                            onClick={() => onStatusChange(event.id, 'confirmed')}
                        >
                            Confirmar evento
                        </Button>
                    )}

                    <VisibilityToggles
                        eventId={event.id}
                        isNamePublic={event.isNamePublic}
                        isLocationPublic={event.isLocationPublic}
                        isLineupPublic={event.isLineupPublic}
                        disabled={isTogglePending}
                        onToggle={onToggleVisibility}
                    />
                </>
            )}
        </li>
    );
}
