'use client';

import { useEffect } from 'react';
import { DayCell } from './day-cell';
import { DayDetailSheet } from './day-detail-sheet';
import { WeekdayHeader } from './weekday-header';
import { formatDateKey } from '../date-range';
import { useCalendarStore } from '../store';
import { useEventRealtime } from '../hooks';
import type { ConflictLevelRecord, CalendarEvent } from '../types';

type Props = {
    collectiveId: string;
    dates: string[];
    pulseRecord: ConflictLevelRecord;
    initialEvents: CalendarEvent[];
};

export function CalendarGridClient({ collectiveId, dates, pulseRecord, initialEvents }: Props) {
    const { selectedDate, isSheetOpen, setSelectedDate, setEvents } = useCalendarStore();

    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents, setEvents]);

    useEventRealtime(collectiveId);

    return (
        <>
            <div className="w-full" role="region" aria-label="Calendário de planejamento">
                <WeekdayHeader />
                <div role="grid" className="grid grid-cols-7 gap-px bg-border border border-border">
                    {dates.map((iso, i) => {
                        const d = new Date(iso);
                        const key = formatDateKey(new Date(iso));
                        return (
                            <DayCell
                                key={`cell-${i}`}
                                date={d}
                                level={pulseRecord[key] ?? null}
                                onSelect={setSelectedDate}
                            />
                        );
                    })}
                </div>
            </div>
            <DayDetailSheet
                date={selectedDate}
                isOpen={isSheetOpen}
                onOpenChange={(open) => {
                    if (!open) setSelectedDate(null);
                }}
            />
        </>
    );
}
