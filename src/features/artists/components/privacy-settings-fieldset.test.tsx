import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacySettingsFieldset } from './privacy-settings-fieldset';

afterEach(cleanup);

describe('PrivacySettingsFieldset', () => {
    it('renderiza 4 opções de privacidade', () => {
        render(<PrivacySettingsFieldset />);
        expect(screen.getByText('Público')).toBeDefined();
        expect(screen.getByText('Apenas Coletivos')).toBeDefined();
        expect(screen.getByText('Privado')).toBeDefined();
        expect(screen.getByText('Ghost Mode')).toBeDefined();
    });

    it('opção "Público" é selecionada por default', () => {
        render(<PrivacySettingsFieldset />);
        const hidden = document.querySelector('input[name="privacySettings"]') as HTMLInputElement;
        const value = JSON.parse(hidden.value);
        expect(value.mode).toBe('public');
    });

    it('mudança para "Privado" atualiza o JSON serializado', async () => {
        render(<PrivacySettingsFieldset />);
        const privateRadio = screen.getByRole('radio', { name: 'Privado' });
        await userEvent.click(privateRadio);

        const hidden = document.querySelector('input[name="privacySettings"]') as HTMLInputElement;
        const value = JSON.parse(hidden.value);
        expect(value.mode).toBe('private');
        expect(value.fields.social_links).toBe('private');
        expect(value.fields.bio).toBe('private');
    });

    it('mudança para "Apenas Coletivos" define fields como collectives_only', async () => {
        render(<PrivacySettingsFieldset />);
        const radio = screen.getByRole('radio', { name: 'Apenas Coletivos' });
        await userEvent.click(radio);

        const hidden = document.querySelector('input[name="privacySettings"]') as HTMLInputElement;
        const value = JSON.parse(hidden.value);
        expect(value.mode).toBe('collectives_only');
        expect(value.fields.social_links).toBe('collectives_only');
    });

    it('mudança para "Ghost Mode" define mode=ghost e fields como private', async () => {
        render(<PrivacySettingsFieldset />);
        const radio = screen.getByRole('radio', { name: 'Ghost Mode' });
        await userEvent.click(radio);

        const hidden = document.querySelector('input[name="privacySettings"]') as HTMLInputElement;
        const value = JSON.parse(hidden.value);
        expect(value.mode).toBe('ghost');
        expect(value.fields.bio).toBe('private');
    });

    it('defaultMode prop define a seleção inicial', () => {
        render(<PrivacySettingsFieldset defaultMode="collectives_only" />);
        const hidden = document.querySelector('input[name="privacySettings"]') as HTMLInputElement;
        const value = JSON.parse(hidden.value);
        expect(value.mode).toBe('collectives_only');
    });
});
