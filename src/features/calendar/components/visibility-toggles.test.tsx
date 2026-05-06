import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisibilityToggles } from './visibility-toggles';

describe('VisibilityToggles', () => {
    it('renders three checkboxes with labels', () => {
        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={false}
                disabled={false}
                onToggle={vi.fn()}
            />
        );

        expect(screen.getByLabelText('Nome público')).toBeDefined();
        expect(screen.getByLabelText('Local público')).toBeDefined();
        expect(screen.getByLabelText('Line-up pública')).toBeDefined();
    });

    it('shows section title', () => {
        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={false}
                disabled={false}
                onToggle={vi.fn()}
            />
        );

        expect(screen.getByText('Visibilidade para outros coletivos')).toBeDefined();
    });

    it('disables all checkboxes when disabled is true', () => {
        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={false}
                disabled={true}
                onToggle={vi.fn()}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBe(3);
        checkboxes.forEach((cb) => {
            expect((cb as HTMLInputElement).disabled).toBe(true);
        });
    });

    it('respects checked state for each toggle', () => {
        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={true}
                disabled={false}
                onToggle={vi.fn()}
            />
        );

        const [nameCb, locationCb, lineupCb] = screen.getAllByRole('checkbox');
        expect(nameCb.getAttribute('data-state')).toBe('checked');
        expect(locationCb.getAttribute('data-state')).toBe('unchecked');
        expect(lineupCb.getAttribute('data-state')).toBe('checked');
    });
});
