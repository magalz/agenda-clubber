import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictBadge } from './conflict-badge';

describe('ConflictBadge', () => {
    it('renders RED dot and X icon for red conflict', () => {
        render(<ConflictBadge level="red" justification="Conflito Vermelho: descrição" />);

        const dot = screen.getByLabelText(/Conflito Vermelho/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-red');

        expect(screen.getByText('Conflito Vermelho: descrição')).toBeDefined();
    });

    it('renders YELLOW dot and AlertTriangle for yellow conflict', () => {
        render(<ConflictBadge level="yellow" justification="Conflito Amarelo" />);

        const dot = screen.getByLabelText(/Conflito Amarelo/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-yellow');
    });

    it('renders GREEN dot and Check for green conflict', () => {
        render(<ConflictBadge level="green" justification={null} />);

        const dot = screen.getByLabelText(/Conflito Verde/);
        expect(dot).toBeDefined();
        expect(dot.className).toContain('bg-neon-green');
    });

    it('renders justification when provided', () => {
        render(<ConflictBadge level="red" justification="Alerta crítico" />);

        expect(screen.getByText('Alerta crítico')).toBeDefined();
    });

    it('does not render justification paragraph when justification is null', () => {
        const { container } = render(<ConflictBadge level="green" justification={null} />);

        const justificationElements = container.querySelectorAll('p.text-xs.text-muted-foreground');
        expect(justificationElements.length).toBe(0);
    });
});
