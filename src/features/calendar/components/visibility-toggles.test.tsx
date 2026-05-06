import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    it('calls onToggle with eventId, field, and value when checkbox is clicked', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();

        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={false}
                disabled={false}
                onToggle={onToggle}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        expect(onToggle).toHaveBeenCalledWith('ev-1', 'isNamePublic', false);
    });

    it('does not call onToggle when disabled', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();

        render(
            <VisibilityToggles
                eventId="ev-1"
                isNamePublic={true}
                isLocationPublic={false}
                isLineupPublic={false}
                disabled={true}
                onToggle={onToggle}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        expect(onToggle).not.toHaveBeenCalled();
    });
});
