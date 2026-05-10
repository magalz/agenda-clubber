import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendAdminGroupMessage, generateAdminGroupDeepLink } from './evolution-api';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, EVOLUTION_API_URL: 'http://localhost:8080', EVOLUTION_API_KEY: 'test-key', EVOLUTION_ADMIN_GROUP_ID: '5511999999999-123456@g.us' };
});

afterEach(() => {
    process.env = ORIGINAL_ENV;
});

describe('sendAdminGroupMessage', () => {
    it('retorna erro se EVOLUTION_API_URL nao configurado', async () => {
        delete process.env.EVOLUTION_API_URL;

        const result = await sendAdminGroupMessage('test');
        expect(result.success).toBe(false);
        expect(result.error).toContain('EVOLUTION_API_URL');
    });

    it('retorna erro se EVOLUTION_ADMIN_GROUP_ID nao configurado', async () => {
        delete process.env.EVOLUTION_ADMIN_GROUP_ID;

        const result = await sendAdminGroupMessage('test');
        expect(result.success).toBe(false);
        expect(result.error).toContain('EVOLUTION_ADMIN_GROUP_ID');
    });

    it('envia mensagem com sucesso', async () => {
        const mockFetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ key: { id: 'msg-123' } }) });
        vi.stubGlobal('fetch', mockFetch);

        const result = await sendAdminGroupMessage('Teste de conflito!');

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        const sendCall = mockFetch.mock.calls[1];
        expect(sendCall[0]).toContain('/message/sendText/');
        const body = JSON.parse(sendCall[1].body);
        expect(body.number).toBe('5511999999999-123456@g.us');
        expect(body.text).toBe('Teste de conflito!');

        vi.unstubAllGlobals();
    });
});

describe('generateAdminGroupDeepLink', () => {
    it('gera link valido para grupo', () => {
        const link = generateAdminGroupDeepLink();
        expect(link).toBe('https://wa.me/5511999999999-123456?text=Agenda%20Clubber%20-%20Admin');
    });

    it('retorna string vazia se nao configurado', () => {
        delete process.env.EVOLUTION_ADMIN_GROUP_ID;
        const link = generateAdminGroupDeepLink();
        expect(link).toBe('');
    });
});
