import { describe, it, expect } from 'vitest';
import { createCollectiveSchema } from './actions';

describe('createCollectiveSchema — whatsappPhone', () => {
    const base = {
        name: 'Coletivo Teste',
        location: 'Fortaleza, CE',
        genrePrimary: 'Techno',
    };

    it('aceita número E.164 válido', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: '+5511999999999' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.whatsappPhone).toBe('+5511999999999');
    });

    it('aceita campo ausente (opcional)', () => {
        const result = createCollectiveSchema.safeParse(base);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.whatsappPhone).toBeUndefined();
    });

    it('aceita string vazia e converte para undefined', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: '' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.whatsappPhone).toBeUndefined();
    });

    it('rejeita número sem +', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: '5511999999999' });
        expect(result.success).toBe(false);
    });

    it('rejeita número muito curto', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: '+55' });
        expect(result.success).toBe(false);
    });

    it('rejeita texto não numérico', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: 'abc' });
        expect(result.success).toBe(false);
    });

    it('aceita número internacional válido com código 1', () => {
        const result = createCollectiveSchema.safeParse({ ...base, whatsappPhone: '+15551234567' });
        expect(result.success).toBe(true);
    });
});
