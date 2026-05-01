import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarGridClient } from './calendar-grid-client';

vi.mock('@tanstack/react-query', () => ({
    useMutation: vi.fn().mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    }),
    useQueryClient: vi.fn().mockReturnValue({
        invalidateQueries: vi.fn(),
    }),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../calendar/actions', () => ({
    createEvent: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn().mockReturnValue({
        channel: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        removeChannel: vi.fn(),
    }),
}));

function makeDates(count: number, startDate = '2026-05-01T15:00:00Z'): string[] {
    const start = new Date(startDate);
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        return d.toISOString();
    });
}

const emptyPulse: Record<string, null> = {};

describe('CalendarGridClient', () => {
    it('renders 30 day cells', () => {
        const dates = makeDates(30);
        render(
            <CalendarGridClient
                collectiveId="test-collective"
                dates={dates}
                pulseRecord={emptyPulse}
                initialEvents={[]}
            />
        );
        expect(screen.getAllByTestId('day-cell')).toHaveLength(30);
    });

    it('renders weekday header with 7 column headers', () => {
        const dates = makeDates(30);
        render(
            <CalendarGridClient
                collectiveId="test-collective"
                dates={dates}
                pulseRecord={emptyPulse}
                initialEvents={[]}
            />
        );
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    });

    it('renders a grid role element', () => {
        const dates = makeDates(30);
        render(
            <CalendarGridClient
                collectiveId="test-collective"
                dates={dates}
                pulseRecord={emptyPulse}
                initialEvents={[]}
            />
        );
        expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('opens the Sheet when a day is clicked', async () => {
        const dates = makeDates(30);
        const user = userEvent.setup();
        render(
            <CalendarGridClient
                collectiveId="test-collective"
                dates={dates}
                pulseRecord={emptyPulse}
                initialEvents={[]}
            />
        );

        await user.click(screen.getAllByTestId('day-cell')[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent(/Eventos de 1 de maio de 2026/);
    });

    it('shows event form in the Sheet (not disabled button)', async () => {
        const dates = makeDates(30);
        const user = userEvent.setup();
        render(
            <CalendarGridClient
                collectiveId="test-collective"
                dates={dates}
                pulseRecord={emptyPulse}
                initialEvents={[]}
            />
        );

        await user.click(screen.getAllByTestId('day-cell')[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome do evento')).toBeInTheDocument();
        expect(screen.getByLabelText('Local do evento')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar evento' })).toBeInTheDocument();
    });
});
