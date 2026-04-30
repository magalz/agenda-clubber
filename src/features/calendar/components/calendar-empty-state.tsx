import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    variant?: 'default' | 'rejected';
};

export function CalendarEmptyState({ variant = 'default' }: Props) {
    const message =
        variant === 'rejected'
            ? 'Seu coletivo não foi aprovado. Entre em contato com os moderadores da Agenda Clubber para mais informações.'
            : 'Você precisa pertencer a um coletivo aprovado para usar o planejamento de eventos.';

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle className="text-lg">Planejamento Indisponível</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">{message}</p>
            </CardContent>
        </Card>
    );
}
