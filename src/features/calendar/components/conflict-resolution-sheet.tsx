'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { MessageCircle, Instagram, Lock } from 'lucide-react';
import { CollectiveCard } from '@/features/collectives/components/collective-card';
import type { ConflictingEventInfo } from '../types';

type Props = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    conflicts: ConflictingEventInfo[];
    isLoading: boolean;
    error: string | null;
};

function formatWaLink(phone: string | null): string | null {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return null;
    return `https://wa.me/${cleaned}`;
}

function formatIgLink(instagramUrl: string | null): string | null {
    if (!instagramUrl || instagramUrl.trim().length === 0) return null;
    const trimmed = instagramUrl.trim().replace(/^@/, '');
    if (trimmed.startsWith('http')) return trimmed;
    return `https://instagram.com/${trimmed}`;
}

function formatPhoneForDisplay(phone: string | null): string {
    if (!phone) return '';
    return phone;
}

export function ConflictResolutionSheet({ isOpen, onOpenChange, conflicts, isLoading, error }: Props) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Resolução de Conflito</SheetTitle>
                    <SheetDescription>
                        Detalhes do evento conflitante e contatos para negociação
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {isLoading && (
                        <div className="space-y-3" data-testid="skeleton">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                            <div className="h-20 w-full animate-pulse rounded bg-muted" />
                            <div className="h-10 w-full animate-pulse rounded bg-muted" />
                            <div className="h-10 w-full animate-pulse rounded bg-muted" />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}

                    {!isLoading && !error && conflicts.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nenhum conflito ativo para este evento.
                        </p>
                    )}

                    {!isLoading && !error && conflicts.map((item) => {
                        const ev = item.event;
                        const isMasked = ev.status === 'planning' && ev.name === 'Em Planejamento';
                        const evDate = new Date(ev.eventDate + 'T00:00:00');
                        const dateStr = evDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                        const waLink = formatWaLink(item.collective.whatsappPhone);
                        const igLink = formatIgLink(item.collective.instagramUrl);

                        return (
                            <div key={ev.id} className="border border-border rounded-md p-3 space-y-3 bg-popover">
                                <div className="flex items-start gap-2">
                                    {isMasked && <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                                    <div>
                                        <p className={`font-medium ${isMasked ? 'text-muted-foreground italic' : ''}`}>
                                            {ev.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {ev.genrePrimary} · {dateStr}
                                        </p>
                                        {ev.locationName !== 'Em Planejamento' && (
                                            <p className="text-xs text-muted-foreground">{ev.locationName}</p>
                                        )}
                                    </div>
                                </div>

                                {item.justification && (
                                    <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                                        {item.justification}
                                    </p>
                                )}

                                <CollectiveCard
                                    name={item.collective.name}
                                    location=""
                                    genrePrimary=""
                                    logoUrl={item.collective.logoUrl}
                                    compact
                                />

                                <div className="flex gap-2">
                                    {waLink && (
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-neon-green/50 px-3 py-1.5 text-xs font-medium text-neon-green hover:bg-neon-green/10 transition-colors"
                                            aria-label={`Chamar no WhatsApp: ${formatPhoneForDisplay(item.collective.whatsappPhone)}`}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>
                                    )}
                                    {igLink && (
                                        <a
                                            href={igLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-pink-500/50 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-500/10 transition-colors"
                                            aria-label={`Ver Instagram: ${item.collective.instagramUrl}`}
                                        >
                                            <Instagram className="w-4 h-4" />
                                            Instagram
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
