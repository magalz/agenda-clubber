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
import { toast } from 'sonner';
import { formatDayLabelPtBr } from '../date-range';
import { EventForm } from './event-form';
import { EventCard } from './event-card';
import { useCalendarStore } from '../store';
import { updateEvent, updateEventStatus } from '../actions';
import type { CalendarEvent } from '../types';

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
        onMutate: (variables) => {
            const prev = events.find((e) => e.id === variables.eventId);
            const patch: Partial<CalendarEvent> = { status: variables.status };
            if (variables.status === 'confirmed') {
                patch.isNamePublic = true;
                patch.isLocationPublic = true;
                patch.isLineupPublic = true;
            }
            patchEvent(variables.eventId, patch);
            return { prev };
        },
        onSuccess: (result, variables, context) => {
            if (result.error) {
                if (context?.prev) patchEvent(variables.eventId, context.prev);
                toast.error(result.error.message);
                return;
            }
            toast.success('Status atualizado');
        },
        onError: (_err, variables, context) => {
            if (context?.prev) patchEvent(variables.eventId, context.prev);
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
                                <EventCard
                                    key={ev.id}
                                    event={ev}
                                    collectiveId={collectiveId}
                                    isStatusPending={statusMutation.isPending}
                                    isTogglePending={toggleMutation.isPending}
                                    onStatusChange={(eventId, status) =>
                                        statusMutation.mutate({ eventId, status })
                                    }
                                    onToggleVisibility={(eventId, field, value) =>
                                        toggleMutation.mutate({ eventId, field, value })
                                    }
                                />
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
