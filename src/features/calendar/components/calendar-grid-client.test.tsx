import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarGridClient } from './calendar-grid-client';

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
        render(<CalendarGridClient dates={dates} pulseRecord={emptyPulse} />);
        expect(screen.getAllByTestId('day-cell')).toHaveLength(30);
    });

    it('renders weekday header with 7 column headers', () => {
        const dates = makeDates(30);
        render(<CalendarGridClient dates={dates} pulseRecord={emptyPulse} />);
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    });

    it('renders a grid role element', () => {
        const dates = makeDates(30);
        render(<CalendarGridClient dates={dates} pulseRecord={emptyPulse} />);
        expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('opens the Sheet when a day is clicked', async () => {
        const dates = makeDates(30);
        const user = userEvent.setup();
        render(<CalendarGridClient dates={dates} pulseRecord={emptyPulse} />);

        await user.click(screen.getAllByTestId('day-cell')[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent(/Eventos de 1 de maio de 2026/);
    });

    it('shows placeholder CTA in the Sheet', async () => {
        const dates = makeDates(30);
        const user = userEvent.setup();
        render(<CalendarGridClient dates={dates} pulseRecord={emptyPulse} />);

        await user.click(screen.getAllByTestId('day-cell')[0]);

        const cta = screen.getByRole('button', { name: 'Adicionar evento' });
        expect(cta).toBeDisabled();
    });
});
