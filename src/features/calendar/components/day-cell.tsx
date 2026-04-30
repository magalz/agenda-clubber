'use client';

import { Check, AlertTriangle, X } from 'lucide-react';
import type { ConflictLevel } from '../types';
import { formatDayLabelPtBr } from '../date-range';

type Props = {
    date: Date;
    level: ConflictLevel | null;
    onSelect: (date: Date) => void;
};

const levelMeta: Record<string, { glow: string; icon: React.ReactNode; label: string }> = {
    green: {
        glow: 'bg-neon-green/20',
        icon: <Check size={14} aria-hidden="true" />,
        label: 'baixo',
    },
    yellow: {
        glow: 'bg-neon-yellow/30',
        icon: <AlertTriangle size={14} aria-hidden="true" />,
        label: 'médio',
    },
    red: {
        glow: 'bg-neon-red/40',
        icon: <X size={14} aria-hidden="true" />,
        label: 'alto',
    },
};

export function DayCell({ date, level, onSelect }: Props) {
    const meta = level ? levelMeta[level] : null;
    const day = date.getUTCDate();
    const labelDate = formatDayLabelPtBr(date);
    const ariaLabel = level && meta
        ? `${labelDate} — ${meta.label} risco de conflito`
        : `${labelDate} — sem eventos`;

    return (
        <button
            type="button"
            data-testid="day-cell"
            className={`aspect-square border border-border focus-visible:ring-2 focus-visible:ring-ring p-2 flex flex-col items-start justify-between font-mono text-sm transition-colors hover:bg-muted/20 ${meta ? meta.glow : 'bg-transparent'}`}
            aria-label={ariaLabel}
            onClick={() => onSelect(date)}
            title={labelDate}
        >
            <span>{day}</span>
            {meta && <span className="self-end">{meta.icon}</span>}
        </button>
    );
}
