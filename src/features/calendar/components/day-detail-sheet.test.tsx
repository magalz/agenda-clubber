import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayDetailSheet } from './day-detail-sheet';
import type { CalendarEvent } from '../types';

vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet">{children}</div>,
    SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./event-form', () => ({
    EventForm: () => <div data-testid="event-form">EventForm</div>,
}));

let mockStoreEvents: CalendarEvent[] = [];

vi.mock('../store', () => ({
    useCalendarStore: (selector: (s: { events: CalendarEvent[] }) => unknown) =>
        selector({ events: mockStoreEvents }),
}));

const baseEvent: CalendarEvent = {
    id: 'ev-1',
    name: 'Festa Techno',
    eventDate: '2026-05-04',
    locationName: 'D-Edge, São Paulo',
    genrePrimary: 'Techno',
    lineup: ['DJ X'],
    status: 'confirmed',
    isNamePublic: true,
    isLocationPublic: true,
    isLineupPublic: true,
    conflictLevel: null,
    conflictJustification: null,
    createdAt: '2026-05-01T00:00:00.000Z',
};

describe('DayDetailSheet', () => {
    beforeEach(() => {
        mockStoreEvents = [];
    });

    it('renders nothing when date is null', () => {
        const { container } = render(
            <DayDetailSheet date={null} isOpen={true} onOpenChange={vi.fn()} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('shows empty message when no events', () => {
        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        expect(screen.getByText('Nenhum evento planejado.')).toBeDefined();
    });

    it('shows event name, location, and genre', () => {
        mockStoreEvents = [baseEvent];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        expect(screen.getByText('Festa Techno')).toBeDefined();
        expect(screen.getByText('D-Edge, São Paulo')).toBeDefined();
        expect(screen.getByText('Techno')).toBeDefined();
    });

    it('shows RED dot and X icon for RED conflict', () => {
        mockStoreEvents = [{
            ...baseEvent,
            conflictLevel: 'red',
            conflictJustification: 'Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h',
        }];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        const dot = screen.getByLabelText(/Conflito Vermelho/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-red');
        expect(screen.getByText('Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h')).toBeDefined();
    });

    it('shows YELLOW dot for YELLOW conflict', () => {
        mockStoreEvents = [{
            ...baseEvent,
            conflictLevel: 'yellow',
            conflictJustification: 'Conflito Amarelo: 2 artistas locais agendados na mesma data',
        }];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        const dot = screen.getByLabelText(/Conflito Amarelo/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-yellow');
    });

    it('shows GREEN dot for GREEN conflict', () => {
        mockStoreEvents = [{
            ...baseEvent,
            conflictLevel: 'green',
            conflictJustification: null,
        }];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        const dot = screen.getByLabelText(/Conflito Verde/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-green');
    });

    it('does not show dot when conflictLevel is null', () => {
        mockStoreEvents = [baseEvent];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        expect(screen.queryByLabelText(/Conflito/)).toBeNull();
    });

    it('renders multiple events with different levels', () => {
        mockStoreEvents = [
            { ...baseEvent, id: 'ev-1', name: 'Red Event', conflictLevel: 'red' as const, conflictJustification: 'Red justification' },
            { ...baseEvent, id: 'ev-2', name: 'Green Event', conflictLevel: 'green' as const, conflictJustification: null },
            { ...baseEvent, id: 'ev-3', name: 'Null Event', conflictLevel: null, conflictJustification: null },
        ];

        render(
            <DayDetailSheet date={new Date('2026-05-04T12:00:00Z')} isOpen={true} onOpenChange={vi.fn()} />
        );

        expect(screen.getByText('Red Event')).toBeDefined();
        expect(screen.getByText('Green Event')).toBeDefined();
        expect(screen.getByText('Null Event')).toBeDefined();
        expect(screen.getByText('Red justification')).toBeDefined();
    });
});
