export const ROLLING_DAYS = 30;

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Sao_Paulo';

const keyFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const labelFmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

export function formatDateKey(d: Date): string {
    return keyFmt.format(d);
}

export function formatDayLabelPtBr(d: Date): string {
    return labelFmt.format(d);
}

export function getRollingThirtyDays(today: Date): Date[] {
    const base = new Date(today);
    return Array.from({ length: ROLLING_DAYS }, (_, i) => {
        const d = new Date(base);
        d.setUTCDate(base.getUTCDate() + i);
        return d;
    });
}
