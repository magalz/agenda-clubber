import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarEmptyState } from './calendar-empty-state';

describe('CalendarEmptyState', () => {
    it('renders default message', () => {
        render(<CalendarEmptyState />);
        expect(
            screen.getByText(/precisa pertencer a um coletivo aprovado/i)
        ).toBeInTheDocument();
    });

    it('renders rejected message', () => {
        render(<CalendarEmptyState variant="rejected" />);
        expect(
            screen.getByText(/não foi aprovado/i)
        ).toBeInTheDocument();
    });
});
