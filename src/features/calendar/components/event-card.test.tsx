import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from './event-card';
import type { CalendarEvent } from '../types';

vi.mock('./ethical-delay-button', () => ({
    EthicalDelayButton: ({ onConfirm }: { onConfirm: () => void }) => (
        <button data-testid="ethical-delay-button" onClick={onConfirm}>EthicalDelayButton</button>
    ),
}));

vi.mock('../logic/visibility', () => ({
    filterEventForViewer: vi.fn((event: { name: string; locationName: string; lineup: string[] }) => ({
        ...event,
        name: 'Nome não revelado',
        locationName: 'Local não revelado',
        lineup: [],
    })),
}));

const baseEvent: CalendarEvent = {
    id: 'ev-1',
    collectiveId: 'coll-a',
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

describe('EventCard', () => {
    it('renders event name, location, and genre', () => {
        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Festa Techno')).toBeDefined();
        expect(screen.getByText('D-Edge, São Paulo')).toBeDefined();
        expect(screen.getByText('Techno')).toBeDefined();
    });

    it('shows confirmed status badge', () => {
        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Confirmado')).toBeDefined();
    });

    it('shows planning status badge', () => {
        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Em Planejamento')).toBeDefined();
    });

    it('shows EthicalDelayButton when RED conflict and planning', () => {
        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning', conflictLevel: 'red' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByTestId('ethical-delay-button')).toBeDefined();
    });

    it('shows simple confirm button when GREEN conflict and planning', () => {
        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning', conflictLevel: 'green' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.queryByTestId('ethical-delay-button')).toBeNull();
        expect(screen.getByText('Confirmar evento')).toBeDefined();
    });

    it('shows "Reabrir planejamento" for own confirmed events', () => {
        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Reabrir planejamento')).toBeDefined();
    });

    it('does not show action buttons for cross-collective events', () => {
        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-b"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.queryByText('Reabrir planejamento')).toBeNull();
        expect(screen.queryByText('Confirmar evento')).toBeNull();
    });

    it('shows conflict badge when conflictLevel is set', () => {
        render(
            <EventCard
                event={{ ...baseEvent, conflictLevel: 'red', conflictJustification: 'Conflito crítico' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByLabelText(/Conflito Vermelho/)).toBeDefined();
    });

    it('shows visibility toggles for own planning events', () => {
        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Visibilidade para outros coletivos')).toBeDefined();
    });

    it('does not show visibility toggles for cross-collective events', () => {
        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning' }}
                collectiveId="coll-b"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.queryByText('Visibilidade para outros coletivos')).toBeNull();
    });

    it('renders lineup when present', () => {
        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText(/DJ X/)).toBeDefined();
    });

    it('masks name with lock icon for cross-collective planning events', () => {
        render(
            <EventCard
                event={{
                    ...baseEvent,
                    collectiveId: 'other-coll',
                    status: 'planning',
                    isNamePublic: false,
                    isLocationPublic: false,
                    isLineupPublic: false,
                }}
                collectiveId="my-coll"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Nome não revelado')).toBeDefined();
        expect(screen.getByLabelText('Nome não revelado')).toBeDefined();
        expect(screen.queryByText('Festa Techno')).toBeNull();
    });

    it('does not crash when lineup is null', () => {
        render(
            <EventCard
                event={{ ...baseEvent, lineup: null as unknown as string[] }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={vi.fn()}
                onToggleVisibility={vi.fn()}
            />
        );

        expect(screen.getByText('Festa Techno')).toBeDefined();
    });

    it('calls onStatusChange with confirmed when clicking confirm button on planning+green event', async () => {
        const user = userEvent.setup();
        const onStatusChange = vi.fn();

        render(
            <EventCard
                event={{ ...baseEvent, status: 'planning', conflictLevel: 'green' }}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={onStatusChange}
                onToggleVisibility={vi.fn()}
            />
        );

        await user.click(screen.getByText('Confirmar evento'));

        expect(onStatusChange).toHaveBeenCalledWith('ev-1', 'confirmed');
    });

    describe('EventCard conflict click', () => {
        it('ATDD-4.1-01: calls onConflictClick when RED badge is clicked', async () => {
            const user = userEvent.setup();
            const onConflictClick = vi.fn();

            render(
                <EventCard
                    event={{
                        ...baseEvent,
                        conflictLevel: 'red',
                        conflictJustification: 'Conflito crítico',
                        collectiveId: 'coll-b',
                    }}
                    collectiveId="coll-a"
                    isStatusPending={false}
                    isTogglePending={false}
                    onStatusChange={vi.fn()}
                    onToggleVisibility={vi.fn()}
                    onConflictClick={onConflictClick}
                />
            );

            const badgeButton = screen.getByRole('button', { name: /Ver detalhes do conflito/i });
            await user.click(badgeButton);

            expect(onConflictClick).toHaveBeenCalledWith('ev-1');
        });

        it('ATDD-4.1-02: calls onConflictClick when YELLOW badge is clicked', async () => {
            const user = userEvent.setup();
            const onConflictClick = vi.fn();

            render(
                <EventCard
                    event={{
                        ...baseEvent,
                        conflictLevel: 'yellow',
                        conflictJustification: 'Gênero próximo',
                        collectiveId: 'coll-b',
                    }}
                    collectiveId="coll-a"
                    isStatusPending={false}
                    isTogglePending={false}
                    onStatusChange={vi.fn()}
                    onToggleVisibility={vi.fn()}
                    onConflictClick={onConflictClick}
                />
            );

            const badgeButton = screen.getByRole('button', { name: /Ver detalhes do conflito/i });
            await user.click(badgeButton);

            expect(onConflictClick).toHaveBeenCalledWith('ev-1');
        });

        it('ATDD-4.1-03: does NOT call onConflictClick when GREEN badge is clicked (static)', () => {
            const onConflictClick = vi.fn();

            render(
                <EventCard
                    event={{
                        ...baseEvent,
                        conflictLevel: 'green',
                        conflictJustification: 'Sem conflitos',
                        collectiveId: 'coll-b',
                    }}
                    collectiveId="coll-a"
                    isStatusPending={false}
                    isTogglePending={false}
                    onStatusChange={vi.fn()}
                    onToggleVisibility={vi.fn()}
                    onConflictClick={onConflictClick}
                />
            );

            expect(screen.queryByRole('button', { name: /Ver detalhes do conflito/i })).toBeNull();
        });

        it('ATDD-4.1-04: conflict badge button has aria-label', () => {
            render(
                <EventCard
                    event={{
                        ...baseEvent,
                        conflictLevel: 'red',
                        conflictJustification: 'Conflito crítico',
                        collectiveId: 'coll-b',
                    }}
                    collectiveId="coll-a"
                    isStatusPending={false}
                    isTogglePending={false}
                    onStatusChange={vi.fn()}
                    onToggleVisibility={vi.fn()}
                    onConflictClick={vi.fn()}
                />
            );

            const badgeButton = screen.getByRole('button', { name: /Ver detalhes do conflito/i });
            expect(badgeButton).toBeDefined();
            expect(badgeButton.getAttribute('aria-label')).toContain('Ver detalhes do conflito');
        });
    });

    it('calls onStatusChange with planning when clicking "Reabrir planejamento" on confirmed event', async () => {
        const user = userEvent.setup();
        const onStatusChange = vi.fn();

        render(
            <EventCard
                event={baseEvent}
                collectiveId="coll-a"
                isStatusPending={false}
                isTogglePending={false}
                onStatusChange={onStatusChange}
                onToggleVisibility={vi.fn()}
            />
        );

        await user.click(screen.getByText('Reabrir planejamento'));

        expect(onStatusChange).toHaveBeenCalledWith('ev-1', 'planning');
    });
});
