'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDayLabelPtBr } from '../date-range';
import { EventForm } from './event-form';
import { EthicalDelayButton } from './ethical-delay-button';
import { useCalendarStore } from '../store';
import { filterEventForViewer } from '../logic/visibility';
import { updateEvent, updateEventStatus } from '../actions';
import type { ConflictLevel, CalendarEvent } from '../types';

const CONFLICT_STYLES: Record<ConflictLevel, { dot: string; icon: typeof Check }> = {
    green: { dot: 'bg-neon-green', icon: Check },
    yellow: { dot: 'bg-neon-yellow', icon: AlertTriangle },
    red: { dot: 'bg-neon-red', icon: X },
};

const CONFLICT_LABELS: Record<ConflictLevel, string> = {
    green: 'Verde',
    yellow: 'Amarelo',
    red: 'Vermelho',
};

type Props = {
    collectiveId?: string;
    date: Date | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DayDetailSheet({ collectiveId, date, isOpen, onOpenChange }: Props) {
    const events = useCalendarStore((s) => s.events);
    const crossEvents = useCalendarStore((s) => s.crossEvents);
    const patchEvent = useCalendarStore((s) => s.updateEvent);

    const statusMutation = useMutation({
        mutationFn: async ({ eventId, status }: { eventId: string; status: 'planning' | 'confirmed' }) => {
            return updateEventStatus(eventId, status) as Promise<{ data: unknown; error: { message: string; code: string } | null }>;
        },
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error.message);
                return;
            }
            const patch: Partial<CalendarEvent> = { status: variables.status };
            if (variables.status === 'confirmed') {
                patch.isNamePublic = true;
                patch.isLocationPublic = true;
                patch.isLineupPublic = true;
            }
            patchEvent(variables.eventId, patch);
            toast.success('Status atualizado');
        },
        onError: () => {
            toast.error('Erro ao atualizar status');
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ eventId, field, value }: { eventId: string; field: string; value: boolean }) => {
            return updateEvent(eventId, { [field]: value }) as Promise<{ data: unknown; error: { message: string; code: string } | null }>;
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error.message);
                return;
            }
        },
        onError: () => {
            toast.error('Erro ao alterar visibilidade');
        },
    });

    const allEvents = useMemo(() => {
        const merged = new Map<string, CalendarEvent>();
        for (const e of crossEvents) merged.set(e.id, e);
        for (const e of events) merged.set(e.id, e);
        return Array.from(merged.values());
    }, [events, crossEvents]);

    if (!date) return null;

    const label = formatDayLabelPtBr(date);
    const eventDateStr = date.toISOString().split('T')[0];

    const dayEvents = allEvents.filter((e) => e.eventDate === eventDateStr);

    function isOwnEvent(ev: CalendarEvent): boolean {
        return Boolean(collectiveId && ev.collectiveId === collectiveId);
    }

    function renderEvent(ev: CalendarEvent) {
        const own = isOwnEvent(ev);
        const displayEvent = own ? ev : filterEventForViewer(ev, { kind: 'anon' }, false);
        const isMasked = !own && ev.status === 'planning';
        const isNameMasked = isMasked && ev.isNamePublic === false && ev.name !== 'Em Planejamento';
        const isLocationMasked = isMasked && ev.isLocationPublic === false;
        const isLineupMasked = isMasked && ev.isLineupPublic === false;

        return (
            <li key={ev.id} className="border border-border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                    {ev.conflictLevel && CONFLICT_STYLES[ev.conflictLevel] && (
                        <>
                            <span
                                className={`inline-block w-2 h-2 rounded-full ${CONFLICT_STYLES[ev.conflictLevel].dot}`}
                                aria-label={`Conflito ${CONFLICT_LABELS[ev.conflictLevel]}: ${ev.conflictJustification ?? 'sem detalhes'}`}
                            />
                            {(() => {
                                const IconComponent = CONFLICT_STYLES[ev.conflictLevel].icon;
                                return <IconComponent className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
                            })()}
                        </>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        ev.status === 'confirmed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                    }`}>
                        {ev.status === 'confirmed' ? 'Confirmado' : 'Em Planejamento'}
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

                {ev.conflictJustification && (
                    <p className="text-xs text-muted-foreground mt-1">{ev.conflictJustification}</p>
                )}

                {displayEvent.lineup.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Line-up: {displayEvent.lineup.join(', ')}
                    </p>
                )}
                {isLineupMasked && displayEvent.lineup.length === 0 && ev.lineup.length > 0 && (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
                        Line-up não revelada <Lock className="w-3 h-3" aria-label="Line-up não revelada" />
                    </p>
                )}

                {own && ev.status === 'confirmed' && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ eventId: ev.id, status: 'planning' })}
                    >
                        Reabrir planejamento
                    </Button>
                )}

                {own && ev.status === 'planning' && (
                    <>
                        {ev.conflictLevel === 'red' ? (
                            <EthicalDelayButton
                                onConfirm={() => statusMutation.mutate({ eventId: ev.id, status: 'confirmed' })}
                                onCancel={() => {}}
                                disabled={statusMutation.isPending}
                            />
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                className="mt-2 w-full"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ eventId: ev.id, status: 'confirmed' })}
                            >
                                Confirmar evento
                            </Button>
                        )}

                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                            <p className="text-xs font-medium text-muted-foreground">Visibilidade para outros coletivos</p>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`name-public-${ev.id}`}
                                    checked={ev.isNamePublic}
                                    disabled={toggleMutation.isPending}
                                    onCheckedChange={(v) => {
                                        toggleMutation.mutate({ eventId: ev.id, field: 'isNamePublic', value: v === true });
                                    }}
                                />
                                <Label htmlFor={`name-public-${ev.id}`} className="text-xs cursor-pointer">Nome público</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`location-public-${ev.id}`}
                                    checked={ev.isLocationPublic}
                                    disabled={toggleMutation.isPending}
                                    onCheckedChange={(v) => {
                                        toggleMutation.mutate({ eventId: ev.id, field: 'isLocationPublic', value: v === true });
                                    }}
                                />
                                <Label htmlFor={`location-public-${ev.id}`} className="text-xs cursor-pointer">Local público</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`lineup-public-${ev.id}`}
                                    checked={ev.isLineupPublic}
                                    disabled={toggleMutation.isPending}
                                    onCheckedChange={(v) => {
                                        toggleMutation.mutate({ eventId: ev.id, field: 'isLineupPublic', value: v === true });
                                    }}
                                />
                                <Label htmlFor={`lineup-public-${ev.id}`} className="text-xs cursor-pointer">Line-up pública</Label>
                            </div>
                        </div>
                    </>
                )}
            </li>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Eventos de {label}</SheetTitle>
                    <SheetDescription className="text-muted-foreground text-sm">
                        {dayEvents.length > 0
                            ? `${dayEvents.length} evento(s) planejado(s)`
                            : 'Nenhum evento planejado.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {dayEvents.length > 0 && (
                        <ul className="space-y-2">
                            {dayEvents.map((ev) => renderEvent(ev))}
                        </ul>
                    )}

                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-3">Adicionar evento</p>
                        <EventForm
                            selectedDate={date}
                            onSuccess={() => onOpenChange(false)}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
