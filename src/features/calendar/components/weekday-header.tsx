const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export function WeekdayHeader() {
    return (
        <div
            role="row"
            className="grid grid-cols-7 border-b border-border"
        >
            {WEEKDAYS.map((day) => (
                <div
                    key={day}
                    role="columnheader"
                    className="p-2 text-center text-xs font-mono text-muted-foreground border-r border-border last:border-r-0"
                >
                    {day}
                </div>
            ))}
        </div>
    );
}
