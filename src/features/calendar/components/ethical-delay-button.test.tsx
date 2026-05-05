import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { EthicalDelayButton } from './ethical-delay-button';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, children }: { value: number; children?: React.ReactNode }) => (
    <div data-testid="progress" data-value={value}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid="mock-button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-triangle-icon" />,
}));

describe('EthicalDelayButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderButton() {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const result = render(
      <EthicalDelayButton onConfirm={onConfirm} onCancel={onCancel} />
    );
    return { onConfirm, onCancel, ...result };
  }

  it('shows trigger button when dialog is closed', () => {
    const { onConfirm, onCancel } = renderButton();
    const trigger = screen.getAllByTestId('mock-button')[0];
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain('Confirmar evento');
    expect(screen.queryByTestId('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('opens dialog with correct message on trigger click', async () => {
    renderButton();
    const trigger = screen.getAllByTestId('mock-button')[0];

    await userEvent.click(trigger);

    expect(screen.getByTestId('dialog')).toBeDefined();
    expect(screen.getByText('Confirmar evento mesmo com conflitos críticos?')).toBeDefined();
    expect(screen.getByText('Atenção')).toBeDefined();
  });

  it('shows countdown value in dialog', async () => {
    renderButton();
    await userEvent.click(screen.getAllByTestId('mock-button')[0]);

    expect(screen.getByText('3s')).toBeDefined();
    expect(screen.getByText('Confirmar (3)')).toBeDefined();
  });

  it('renders progress bar with initial value 0', async () => {
    renderButton();
    await userEvent.click(screen.getAllByTestId('mock-button')[0]);

    const progress = screen.getByTestId('progress');
    expect(progress).toBeDefined();
    expect(progress.getAttribute('data-value')).toBe('0');
  });

  it('decrements countdown and advances progress', async () => {
    renderButton();
    await userEvent.click(screen.getAllByTestId('mock-button')[0]);
    expect(screen.getByText('3s')).toBeDefined();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('2s')).toBeDefined();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('1s')).toBeDefined();
  });

  it('calls onConfirm after duration elapses and shows toast', async () => {
    const { onConfirm } = renderButton();

    await userEvent.click(screen.getAllByTestId('mock-button')[0]);
    expect(onConfirm).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(3000); });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      'Evento confirmado. Lembre-se: a consciência coletiva fortalece a cena.'
    );
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const { onConfirm, onCancel } = renderButton();
    await userEvent.click(screen.getAllByTestId('mock-button')[0]);
    expect(screen.getByTestId('dialog')).toBeDefined();

    act(() => { vi.advanceTimersByTime(1000); });

    const buttons = screen.getAllByTestId('mock-button');
    const cancelBtn = buttons.find((b) => b.textContent === 'Cancelar')!;
    await userEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('cleans up timer on unmount', async () => {
    const { unmount } = render(
      <EthicalDelayButton onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    await userEvent.click(screen.getAllByTestId('mock-button')[0]);
    unmount();

    act(() => { vi.advanceTimersByTime(3000); });
  });

  it('does not call onConfirm if cancelled mid-countdown', async () => {
    const { onConfirm, onCancel } = renderButton();
    await userEvent.click(screen.getAllByTestId('mock-button')[0]);

    act(() => { vi.advanceTimersByTime(1500); });

    const buttons = screen.getAllByTestId('mock-button');
    const cancelBtn = buttons.find((b) => b.textContent === 'Cancelar')!;
    await userEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables trigger button when disabled prop is true', () => {
    render(
      <EthicalDelayButton onConfirm={vi.fn()} onCancel={vi.fn()} disabled={true} />
    );
    const trigger = screen.getAllByTestId('mock-button')[0];
    expect(trigger.hasAttribute('disabled')).toBe(true);
  });

  it('enables trigger button when disabled prop is false', () => {
    render(
      <EthicalDelayButton onConfirm={vi.fn()} onCancel={vi.fn()} disabled={false} />
    );
    const trigger = screen.getAllByTestId('mock-button')[0];
    expect(trigger.hasAttribute('disabled')).toBe(false);
  });

  it('enables trigger button by default without disabled prop', () => {
    renderButton();
    const trigger = screen.getAllByTestId('mock-button')[0];
    expect(trigger.hasAttribute('disabled')).toBe(false);
  });
});
