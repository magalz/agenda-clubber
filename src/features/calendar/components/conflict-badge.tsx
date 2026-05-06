'use client';

import { Check, AlertTriangle, X } from 'lucide-react';
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
    level: ConflictLevel;
    justification: string | null;
};

export function ConflictBadge({ level, justification }: Props) {
    const style = CONFLICT_STYLES[level];
    const label = CONFLICT_LABELS[level];

    return (
        <>
            <span
                className={`inline-block w-2 h-2 rounded-full ${style.dot}`}
                aria-label={`Conflito ${label}: ${justification ?? 'sem detalhes'}`}
            />
            {(() => {
                const IconComponent = style.icon;
                return <IconComponent className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
            })()}
            {justification && (
                <p className="text-xs text-muted-foreground mt-1">{justification}</p>
            )}
        </>
    );
}
