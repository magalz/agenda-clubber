'use client';

import { useState } from 'react';
import { DayCell } from './day-cell';
import { DayDetailSheet } from './day-detail-sheet';
import { WeekdayHeader } from './weekday-header';
import { formatDateKey } from '../date-range';
import type { ConflictLevelRecord } from '../types';

type Props = {
    dates: string[];
    pulseRecord: ConflictLevelRecord;
};

export function CalendarGridClient({ dates, pulseRecord }: Props) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
                onOpenChange={(open) => {
                    if (!open) setSelectedDate(null);
                }}
            />
        </>
    );
}
