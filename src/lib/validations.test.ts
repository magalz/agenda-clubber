import { describe, it, expect } from 'vitest';
import { e164Phone, e164PhoneOptional } from './validations';

describe('e164Phone', () => {
    it('aceita +5511999999999 (BR com DDD)', () => {
        const result = e164Phone.safeParse('+5511999999999');
        expect(result.success).toBe(true);
    });

    it('aceita +1 (US mínimo)', () => {
        const result = e164Phone.safeParse('+15551234567');
        expect(result.success).toBe(true);
    });

    it('rejeita número sem +', () => {
        const result = e164Phone.safeParse('5511999999999');
        expect(result.success).toBe(false);
    });

    it('rejeita número muito curto (só código do país)', () => {
        const result = e164Phone.safeParse('+55');
        expect(result.success).toBe(false);
    });

    it('rejeita string vazia', () => {
        const result = e164Phone.safeParse('');
        expect(result.success).toBe(false);
    });

    it('rejeita texto', () => {
        const result = e164Phone.safeParse('abc');
        expect(result.success).toBe(false);
    });
});

describe('e164PhoneOptional', () => {
    it('aceita número válido', () => {
        const result = e164PhoneOptional.safeParse('+5511999999999');
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBe('+5511999999999');
    });

    it('converte string vazia para undefined', () => {
        const result = e164PhoneOptional.safeParse('');
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBeUndefined();
    });

    it('aceita undefined', () => {
        const result = e164PhoneOptional.safeParse(undefined);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBeUndefined();
    });

    it('rejeita número inválido', () => {
        const result = e164PhoneOptional.safeParse('11999999999');
        expect(result.success).toBe(false);
    });
});
