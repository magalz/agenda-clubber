import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayCell } from './day-cell';

describe('DayCell', () => {
    const baseDate = new Date('2026-05-15T15:00:00Z');

    it('renders day number and ARIA label for null level', () => {
        render(<DayCell date={baseDate} level={null} onSelect={vi.fn()} />);
        const btn = screen.getByTestId('day-cell');
        expect(btn).toHaveTextContent('15');
        expect(btn).toHaveAttribute('aria-label', '15 de maio de 2026 — sem eventos');
    });

    it('renders green level with correct classes and check icon', () => {
        render(<DayCell date={baseDate} level="green" onSelect={vi.fn()} />);
        const btn = screen.getByTestId('day-cell');
        expect(btn.className).toContain('bg-neon-green/20');
        expect(btn).toHaveAttribute('aria-label', '15 de maio de 2026 — baixo risco de conflito');
    });

    it('renders yellow level with correct classes and alert icon', () => {
        render(<DayCell date={baseDate} level="yellow" onSelect={vi.fn()} />);
        const btn = screen.getByTestId('day-cell');
        expect(btn.className).toContain('bg-neon-yellow/30');
        expect(btn).toHaveAttribute('aria-label', '15 de maio de 2026 — médio risco de conflito');
    });

    it('renders red level with correct classes and X icon', () => {
        render(<DayCell date={baseDate} level="red" onSelect={vi.fn()} />);
        const btn = screen.getByTestId('day-cell');
        expect(btn.className).toContain('bg-neon-red/40');
        expect(btn).toHaveAttribute('aria-label', '15 de maio de 2026 — alto risco de conflito');
    });

    it('calls onSelect with the date when clicked', async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<DayCell date={baseDate} level={null} onSelect={onSelect} />);
        await user.click(screen.getByTestId('day-cell'));
        expect(onSelect).toHaveBeenCalledWith(baseDate);
    });

    it('has focus-visible ring class', () => {
        render(<DayCell date={baseDate} level={null} onSelect={vi.fn()} />);
        const btn = screen.getByTestId('day-cell');
        expect(btn.className).toContain('focus-visible:ring-2');
    });
});
