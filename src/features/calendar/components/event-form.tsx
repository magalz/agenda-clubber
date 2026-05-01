'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { GENRE_OPTIONS, eventFormSchema, type EventFormInput } from '../validations';
import { createEvent } from '../actions';
import { formatDayLabelPtBr } from '../date-range';

type Props = {
    selectedDate: Date;
    onSuccess: () => void;
};

export function EventForm({ selectedDate, onSuccess }: Props) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [genre, setGenre] = useState('');
    const [lineupText, setLineupText] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: async (input: EventFormInput) => {
            return createEvent(input) as Promise<{ data: unknown; error: { message: string; code: string } | null }>;
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error.message);
                return;
            }
            toast.success('Evento criado');
            onSuccess();
        },
        onError: () => {
            toast.error('Erro ao criar evento');
        },
    });

    const eventDateStr = selectedDate.toISOString().split('T')[0];
    const label = formatDayLabelPtBr(selectedDate);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFieldErrors({});

        const lineup = lineupText
            ? lineupText.split('\n').map((s) => s.trim()).filter(Boolean)
            : [];

        const parsed = eventFormSchema.safeParse({
            name,
            eventDate: eventDateStr,
            location,
            genre: genre as EventFormInput['genre'],
            lineup,
        });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const field = issue.path[0] as string;
                if (!errors[field]) errors[field] = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        mutation.mutate(parsed.data);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Data do evento</Label>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>

            <div>
                <Label htmlFor="event-name">
                    Nome do evento <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="event-name"
                    aria-label="Nome do evento"
                    aria-required="true"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Festival das Flores"
                />
                {fieldErrors.name && (
                    <p className="text-red-500 text-sm mt-1" role="alert">{fieldErrors.name}</p>
                )}
            </div>

            <div>
                <Label htmlFor="event-location">
                    Local <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="event-location"
                    aria-label="Local do evento"
                    aria-required="true"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: D-Edge, São Paulo"
                />
                {fieldErrors.location && (
                    <p className="text-red-500 text-sm mt-1" role="alert">{fieldErrors.location}</p>
                )}
            </div>

            <div>
                <Label htmlFor="event-genre">
                    Gênero musical <span className="text-red-500">*</span>
                </Label>
                <Select value={genre} onValueChange={(v) => setGenre(v ?? '')}>
                    <SelectTrigger aria-label="Genero musical">
                        <SelectValue placeholder="Selecione um gênero" />
                    </SelectTrigger>
                    <SelectContent>
                        {GENRE_OPTIONS.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {fieldErrors.genre && (
                    <p className="text-red-500 text-sm mt-1" role="alert">{fieldErrors.genre}</p>
                )}
            </div>

            <div>
                <Label htmlFor="event-lineup">Line-up (um artista por linha)</Label>
                <Textarea
                    id="event-lineup"
                    aria-label="Line-up do evento"
                    value={lineupText}
                    onChange={(e) => setLineupText(e.target.value)}
                    placeholder="DJ A&#10;DJ B&#10;Banda C"
                    rows={4}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
            >
                {mutation.isPending ? 'Salvando...' : 'Salvar evento'}
            </Button>
        </form>
    );
}
