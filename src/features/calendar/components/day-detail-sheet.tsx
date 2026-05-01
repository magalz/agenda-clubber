'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatDayLabelPtBr } from '../date-range';
import { EventForm } from './event-form';
import { useCalendarStore } from '../store';

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
                                    <p className="font-medium">{ev.name}</p>
                                    <p className="text-sm text-muted-foreground">{ev.locationName}</p>
                                    <p className="text-xs text-muted-foreground">{ev.genrePrimary}</p>
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
