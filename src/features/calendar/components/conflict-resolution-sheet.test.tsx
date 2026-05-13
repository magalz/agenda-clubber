import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictResolutionSheet } from './conflict-resolution-sheet';
import type { ConflictingEventInfo } from '../types';

vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
        open ? <div data-testid="sheet">{children}</div> : null,
    SheetContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="sheet-content">{children}</div>
    ),
    SheetHeader: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="sheet-header">{children}</div>
    ),
    SheetTitle: ({ children }: { children: React.ReactNode }) => (
        <h2 data-testid="sheet-title">{children}</h2>
    ),
    SheetDescription: ({ children }: { children: React.ReactNode }) => (
        <p data-testid="sheet-description">{children}</p>
    ),
}));

vi.mock('lucide-react', () => ({
    MessageCircle: () => <svg data-testid="icon-message-circle" />,
    Instagram: () => <svg data-testid="icon-instagram" />,
    Lock: () => <svg data-testid="icon-lock" />,
    X: () => <svg data-testid="icon-x" />,
}));

const mockCollective = {
    name: 'Coletivo X',
    logoUrl: 'https://example.com/logo.png',
    whatsappPhone: '+5511999999999',
    instagramUrl: '@coletivo_x',
};

const baseConflictingEvent: ConflictingEventInfo = {
    event: {
        id: 'ev-2',
        collectiveId: 'coll-b',
        name: 'Festa Concorrente',
        eventDate: '2026-05-05',
        locationName: 'São Paulo, SP',
        genrePrimary: 'Techno',
        lineup: ['DJ A', 'DJ B'],
        status: 'planning',
        isNamePublic: true,
        isLocationPublic: true,
        isLineupPublic: true,
        conflictLevel: 'red',
        conflictJustification: 'Mesmo gênero Techno',
        createdAt: '2026-05-01T00:00:00.000Z',
    },
    collective: mockCollective,
    justification: 'Mesmo gênero Techno',
};

describe('ConflictResolutionSheet', () => {
    it('ATDD-4.1-05: renders sheet title when open with conflicts loaded', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByTestId('sheet-title')).toBeDefined();
    });

    it('ATDD-4.1-09: shows "Em Planejamento" and Lock icon for masked events', () => {
        const maskedEvent: ConflictingEventInfo = {
            ...baseConflictingEvent,
            event: {
                ...baseConflictingEvent.event,
                name: 'Em Planejamento',
                locationName: 'Em Planejamento',
                lineup: [],
                isNamePublic: false,
                isLocationPublic: false,
                isLineupPublic: false,
            },
        };

        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[maskedEvent]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText('Em Planejamento')).toBeDefined();
        expect(screen.getByTestId('icon-lock')).toBeDefined();
    });

    it('ATDD-4.1-10: shows full details for confirmed events', () => {
        const confirmedEvent: ConflictingEventInfo = {
            ...baseConflictingEvent,
            event: {
                ...baseConflictingEvent.event,
                status: 'confirmed',
            },
        };

        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[confirmedEvent]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText('Festa Concorrente')).toBeDefined();
        expect(screen.getByText('São Paulo, SP')).toBeDefined();
    });

    it('ATDD-4.1-11: shows empty state when no conflicts', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText(/Nenhum conflito ativo/i)).toBeDefined();
    });

    it('ATDD-4.1-13: renders WhatsApp button with correct wa.me link', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        const waLink = screen.getByRole('link', { name: /Chamar no WhatsApp/i });
        expect(waLink).toBeDefined();
        expect(waLink.getAttribute('href')).toBe('https://wa.me/5511999999999');
    });

    it('ATDD-4.1-14: renders Instagram button with correct link', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        const igLink = screen.getByRole('link', { name: /Ver Instagram/i });
        expect(igLink).toBeDefined();
        expect(igLink.getAttribute('href')).toBe('https://instagram.com/coletivo_x');
    });

    it('ATDD-4.1-15: hides WhatsApp button when phone is null', () => {
        const noWa: ConflictingEventInfo = {
            ...baseConflictingEvent,
            collective: { ...mockCollective, whatsappPhone: null },
        };

        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[noWa]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.queryByRole('link', { name: /Chamar no WhatsApp/i })).toBeNull();
    });

    it('ATDD-4.1-16: hides Instagram button when instagram is null', () => {
        const noIg: ConflictingEventInfo = {
            ...baseConflictingEvent,
            collective: { ...mockCollective, instagramUrl: null },
        };

        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[noIg]}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.queryByRole('link', { name: /Ver Instagram/i })).toBeNull();
    });

    it('ATDD-4.1-17: buttons open in new tab with noopener noreferrer', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        const waLink = screen.getByRole('link', { name: /Chamar no WhatsApp/i });
        expect(waLink.getAttribute('target')).toBe('_blank');
        expect(waLink.getAttribute('rel')).toBe('noopener noreferrer');

        const igLink = screen.getByRole('link', { name: /Ver Instagram/i });
        expect(igLink.getAttribute('target')).toBe('_blank');
        expect(igLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('ATDD-4.1-19: WhatsApp button has descriptive aria-label', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        const waLink = screen.getByRole('link', { name: /Chamar no WhatsApp/i });
        expect(waLink.getAttribute('aria-label')).toContain('55');
    });

    it('ATDD-4.1-20: Instagram button has descriptive aria-label', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[baseConflictingEvent]}
                isLoading={false}
                error={null}
            />
        );

        const igLink = screen.getByRole('link', { name: /Ver Instagram/i });
        expect(igLink.getAttribute('aria-label')).toContain('Instagram');
    });

    it('shows loading skeleton while fetching', () => {
        render(
            <ConflictResolutionSheet
                eventId="ev-1"
                isOpen={true}
                onOpenChange={vi.fn()}
                conflicts={[]}
                isLoading={true}
                error={null}
            />
        );

        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
});
