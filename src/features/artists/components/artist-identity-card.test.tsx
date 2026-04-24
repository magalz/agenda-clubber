import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtistIdentityCard } from './artist-identity-card';

afterEach(cleanup);

describe('ArtistIdentityCard', () => {
  const baseProps = {
    artisticName: 'DJ Test',
    location: 'São Paulo',
    genrePrimary: 'Eletrônico',
  };

  it('variante verified renderiza ícone com aria-label "Perfil verificado"', () => {
    render(<ArtistIdentityCard variant="verified" {...baseProps} />);
    expect(
      screen.getByLabelText('Perfil verificado')
    ).toBeDefined();
  });

  it('variante restricted renderiza badge com texto "Restricted"', () => {
    render(<ArtistIdentityCard variant="restricted" {...baseProps} />);
    expect(screen.getByText('Restricted')).toBeDefined();
  });

  it('sem onClaim → botão de claim não existe', () => {
    render(<ArtistIdentityCard variant="restricted" {...baseProps} />);
    expect(screen.queryByText('Claim this Profile')).toBeNull();
  });

  it('com onClaim → botão "Claim this Profile" visível', async () => {
    const handleClaim = vi.fn();
    render(
      <ArtistIdentityCard
        variant="restricted"
        {...baseProps}
        onClaim={handleClaim}
      />
    );
    const btn = screen.getByText('Claim this Profile');
    expect(btn).toBeDefined();
    await userEvent.click(btn);
    expect(handleClaim).toHaveBeenCalledTimes(1);
  });

  it('modo compact oculta genre e exibe apenas location', () => {
    render(
      <ArtistIdentityCard variant="verified" {...baseProps} compact />
    );
    expect(screen.getByText('São Paulo')).toBeDefined();
    // In compact mode, genre is not shown (no Music icon row)
    expect(screen.queryByText('Eletrônico')).toBeNull();
  });

  it('exibe nome artístico', () => {
    render(<ArtistIdentityCard variant="verified" {...baseProps} />);
    expect(screen.getByText('DJ Test')).toBeDefined();
  });
});
