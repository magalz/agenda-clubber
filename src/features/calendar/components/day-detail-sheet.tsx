'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Check, AlertTriangle, X } from 'lucide-react';
import { formatDayLabelPtBr } from '../date-range';
import { EventForm } from './event-form';
import { useCalendarStore } from '../store';
import type { ConflictLevel } from '../types';

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
    date: Date | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DayDetailSheet({ date, isOpen, onOpenChange }: Props) {
    const events = useCalendarStore((s) => s.events);

    if (!date) return null;

    const label = formatDayLabelPtBr(date);
    const eventDateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter((e) => e.eventDate === eventDateStr);

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
                            {dayEvents.map((ev) => (
                                <li key={ev.id} className="border border-border rounded-md p-3">
                                    <div className="flex items-center gap-2">
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
                                        <p className="font-medium">{ev.name}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{ev.locationName}</p>
                                    <p className="text-xs text-muted-foreground">{ev.genrePrimary}</p>
                                    {ev.conflictJustification && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {ev.conflictJustification}
                                        </p>
                                    )}
                                </li>
                            ))}
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
