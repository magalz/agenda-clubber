'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDayLabelPtBr } from '../date-range';

type Props = {
    date: Date | null;
    onOpenChange: (open: boolean) => void;
};

export function DayDetailSheet({ date, onOpenChange }: Props) {
    if (!date) return null;

    const label = formatDayLabelPtBr(date);

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Eventos de {label}</SheetTitle>
                    <SheetDescription className="text-muted-foreground text-sm">
                        Nenhum evento planejado.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <Button
                        disabled
                        aria-disabled="true"
                        title="Em breve — Story 3.2"
                    >
                        Adicionar evento
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
