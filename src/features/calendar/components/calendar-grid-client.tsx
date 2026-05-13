'use client';

import { useEffect, useMemo, useState } from 'react';
import { DayCell } from './day-cell';
import { DayDetailSheet } from './day-detail-sheet';
import { ConflictResolutionSheet } from './conflict-resolution-sheet';
import { WeekdayHeader } from './weekday-header';
import { formatDateKey } from '../date-range';
import { useCalendarStore } from '../store';
import { useEventRealtime, useCrossCollectiveEvents } from '../hooks';
import { getConflictingEventsAction } from '../actions';
import type { ConflictLevelRecord, CalendarEvent, ConflictingEventInfo } from '../types';

type Props = {
    collectiveId: string;
    dates: string[];
    pulseRecord: ConflictLevelRecord;
    initialEvents: CalendarEvent[];
};

export function CalendarGridClient({ collectiveId, dates, pulseRecord, initialEvents }: Props) {
    const { selectedDate, isSheetOpen, setSelectedDate, setEvents, selectedConflictEventId, setSelectedConflictEventId } = useCalendarStore();

    const dateObjects = useMemo(() => dates.map((d) => new Date(d)), [dates]);

    const [conflicts, setConflicts] = useState<ConflictingEventInfo[]>([]);
    const [conflictsLoading, setConflictsLoading] = useState(false);
    const [conflictsError, setConflictsError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        if (selectedConflictEventId) {
            setConflictsLoading(true);
            setConflictsError(null);
            getConflictingEventsAction(selectedConflictEventId)
                .then((data) => {
                    if (!ignore) setConflicts(data);
                })
                .catch(() => {
                    if (!ignore) setConflictsError('Erro ao carregar detalhes do conflito');
                })
                .finally(() => {
                    if (!ignore) setConflictsLoading(false);
                });
        } else {
            setConflicts([]);
        }

        return () => { ignore = true; };
    }, [selectedConflictEventId]);

    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents, setEvents]);

    useEventRealtime(collectiveId);
    useCrossCollectiveEvents(dateObjects);

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
                collectiveId={collectiveId}
                date={selectedDate}
                isOpen={isSheetOpen}
                onOpenChange={(open) => {
                    if (!open) setSelectedDate(null);
                }}
            />
            <ConflictResolutionSheet
                isOpen={selectedConflictEventId !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedConflictEventId(null);
                }}
                conflicts={conflicts}
                isLoading={conflictsLoading}
                error={conflictsError}
            />
        </>
    );
}
